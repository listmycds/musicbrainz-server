package MusicBrainz::Server::Controller::WS::js;

use Moose;
BEGIN { extends 'MusicBrainz::Server::Controller'; }

use MusicBrainz::Server::Constants qw( $DARTIST_ID $DLABEL_ID );
use MusicBrainz::Server::WebService::JSONSerializer;
use MusicBrainz::Server::WebService::Validator;
use MusicBrainz::Server::Filters;
use MusicBrainz::Server::Data::Search qw( escape_query alias_query );
use MusicBrainz::Server::Data::Utils qw( type_to_model );
use MusicBrainz::Server::Track qw( format_track_length );
use Readonly;
use Text::Trim;
use Text::Unaccent qw( unac_string_utf16 );
use Data::OptList;
use Encode qw( decode encode );

# This defines what options are acceptable for WS calls
my $ws_defs = Data::OptList::mkopt([
     artist => {
         method   => 'GET',
         required => [ qw(q) ],
         optional => [ qw(limit page timestamp) ]
     },
     label => {
         method   => 'GET',
         required => [ qw(q) ],
         optional => [ qw(limit page timestamp) ]
     },
     recording => {
         method   => 'GET',
         required => [ qw(q) ],
         optional => [ qw(a r limit page timestamp) ]
     },
     tracklist => {
        method => 'GET',
     }
]);

with 'MusicBrainz::Server::WebService::Validator' =>
{
     defs => $ws_defs,
     version => 'js',
     default_serialization_type => 'json',
};

Readonly my %serializers => (
    json => 'MusicBrainz::Server::WebService::JSONSerializer',
);

sub bad_req : Private
{
    my ($self, $c) = @_;
    $c->res->status(400);
    $c->res->content_type($c->stash->{serializer}->mime_type . '; charset=utf-8');
    $c->res->body($c->stash->{serializer}->output_error($c->stash->{error}));
}

sub begin : Private
{
}

sub end : Private
{
}

sub root : Chained('/') PathPart("ws/js") CaptureArgs(0)
{
    my ($self, $c) = @_;
    $self->validate($c, \%serializers) or $c->detach('bad_req');
}

sub _autocomplete_entity {
    my ($self, $c, $type) = @_;

    my $query = trim $c->stash->{args}->{q};
    $query = decode ("utf-16", unac_string_utf16 (encode ("utf-16", $query)));
    $query = escape_query ($query);

    my $limit = $c->stash->{args}->{limit} || 10;
    my $page = $c->stash->{args}->{page} || 1;

    unless ($query) {
        $c->detach('bad_req');
    }

    $query = $query.'*';

    if (grep ($type eq $_, 'artist', 'label', 'work'))
    {
        $query = alias_query ($type, $query);
    }

    my $model = type_to_model ($type);

    my $no_redirect = 1;
    my $response = $c->model ('Search')->external_search (
        $c, $type, $query, $limit, $page, 1, undef, $no_redirect);

    my @output;

    if ($response->{pager})
    {
        my $pager = $response->{pager};

        for my $result (@{ $response->{results} })
        {
            my $entity = $c->model($model)->get_by_gid ($result->{entity}->gid);

            push @output, {
                name => $result->{entity}->name,
                id => $entity->id,
                gid => $result->{entity}->gid,
                comment => $result->{entity}->comment,
            } if $entity;
        }

        push @output, {
            pages => $pager->last_page,
            current => $pager->current_page
        };
    }
    else
    {
        # If an error occurred just ignore it for now and return an
        # empty list.  The javascript code for autocomplete doesn't
        # have any way to gracefully report or deal with
        # errors. --warp.
    }

    $c->res->content_type($c->stash->{serializer}->mime_type . '; charset=utf-8');
    $c->res->body($c->stash->{serializer}->serialize('generic', \@output));
}

sub artist : Chained('root') PathPart('artist') Args(0)
{
    my ($self, $c) = @_;

    $self->_autocomplete_entity($c, 'artist');
}

sub label : Chained('root') PathPart('label') Args(0)
{
    my ($self, $c) = @_;

    $self->_autocomplete_entity($c, 'label');
}

sub _serialize_release_groups
{
    my (@rgs) = @_;

    my @ret;

    for (@rgs)
    {
        push @ret, { 'name' => $_->name, 'gid' => $_->gid, };
    }

    return \@ret;
}

sub recording : Chained('root') PathPart('recording') Args(0)
{
    my ($self, $c) = @_;

    my $query = escape_query ($c->stash->{args}->{q});
    my $artist = escape_query ($c->stash->{args}->{a} || '');
    my $limit = $c->stash->{args}->{limit} || 10;
    my $page = $c->stash->{args}->{page} || 1;

    my $response = $c->model ('Search')->external_search (
        $c, 'recording', "$query artist:\"$artist\"", $limit, $page, 1, undef, 1);

    my $pager = $response->{pager};

    my @entities;
    for my $result (@{ $response->{results} })
    {
        my @rgs = $c->model ('ReleaseGroup')->find_by_release_gids (
            map { $_->gid } @{ $result->{extra} });

        push @entities, {
            gid => $result->{entity}->gid,
            id => $result->{entity}->id,
            length => MusicBrainz::Server::Filters::format_length ($result->{entity}->length),
            name => $result->{entity}->name,
            artist => $result->{entity}->artist_credit->name,
            releasegroups => _serialize_release_groups (@rgs),
        };
    }

    $c->res->content_type($c->stash->{serializer}->mime_type . '; charset=utf-8');
    $c->res->body($c->stash->{serializer}->serialize('generic', \@entities));
}

sub tracklist : Chained('root') PathPart Args(1) {
    my ($self, $c, $id) = @_;
    my $tracklist = $c->model('Tracklist')->get_by_id($id);
    $c->model('Track')->load_for_tracklists($tracklist);
    $c->model('ArtistCredit')->load($tracklist->all_tracks);
    $c->model('Artist')->load(map { @{ $_->artist_credit->names } }
        $tracklist->all_tracks);

    my $structure = [ map {
        length => format_track_length($_->length),
        name => $_->name,
        artist_credit => {
            names => [ map {
                name => $_->name,
                gid => $_->artist->gid,
                artist_name => $_->artist->name,
                join => $_->join_phrase
            }, @{ $_->artist_credit->names } ],
            preview => $_->artist_credit->name
        }
    }, sort { $a->position <=> $b->position }
    $tracklist->all_tracks ];

    $c->res->content_type($c->stash->{serializer}->mime_type . '; charset=utf-8');
    $c->res->body($c->stash->{serializer}->serialize('generic', $structure));
}

sub default : Path
{
    my ($self, $c, $resource) = @_;

    $c->stash->{serializer} = $serializers{$self->get_default_serialization_type}->new();
    $c->stash->{error} = "Invalid resource: $resource.";
    $c->detach('bad_req');
}

no Moose;
1;

=head1 COPYRIGHT

Copyright (C) 2010 MetaBrainz Foundation

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

=cut
