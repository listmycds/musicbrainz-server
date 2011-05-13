package MusicBrainz::Server::Edit::Historic::AddLink;
use strict;
use warnings;

use MusicBrainz::Server::Edit::Types qw( PartialDateHash );
use MusicBrainz::Server::Edit::Historic::Utils qw( upgrade_date upgrade_type );
use MusicBrainz::Server::Constants qw( $EDIT_HISTORIC_ADD_LINK );
use MusicBrainz::Server::Data::Utils qw( type_to_model );
use MusicBrainz::Server::Translation qw ( l ln );

use aliased 'MusicBrainz::Server::Entity::Link';
use aliased 'MusicBrainz::Server::Entity::LinkType';
use aliased 'MusicBrainz::Server::Entity::PartialDate';
use aliased 'MusicBrainz::Server::Entity::Relationship';

use MusicBrainz::Server::Edit::Historic::Base;

sub edit_name     { l('Add relationship') }
sub edit_type     { $EDIT_HISTORIC_ADD_LINK }
sub edit_template { 'historic/add_relationship' }
sub historic_type { 33 }

sub related_entities
{
    my $self = shift;
    my %rel;

    for my $link (@{ $self->data->{links} }) {
        $rel{ $link->{entity0_type} } ||= [];
        push @{ $rel{ $link->{entity0_type} } }, $link->{entity0_id};

        $rel{ $link->{entity1_type} } ||= [];
        push @{ $rel{ $link->{entity1_type} } }, $link->{entity1_id};
    }

    return \%rel;
}

sub foreign_keys
{
    my $self = shift;
    my %fk;

    for my $link (@{ $self->data->{links} }) {
        my $k0 = type_to_model($link->{entity0_type});
        $fk{ $k0  } ||= [];
        push @{ $fk{ $k0 } }, $link->{entity0_id};

        my $k1 = type_to_model($link->{entity1_type});
        $fk{ $k1  } ||= [];
        push @{ $fk{ $k1 } }, $link->{entity1_id};
    }

    return \%fk;
}

sub build_display_data
{
    my ($self, $loaded) = @_;
    return {
        relationships => map {
            my $model0 = type_to_model( $_->{entity0_type} );
            my $model1 = type_to_model( $_->{entity1_type} );
            my $entity0_id = $_->{entity0_id};
            my $entity1_id = $_->{entity1_id};

            Relationship->new(
                entity0 => $loaded->{ $model0 }{ $entity0_id } ||
                    $self->c->model($model0)->_entity_class->new( name => $_->{entity0_name}),
                entity1 => $loaded->{ $model1 }{ $entity1_id } ||
                    $self->c->model($model0)->_entity_class->new( name => $_->{entity1_name}),
                link    => Link->new(
                    id => $self->data->{link_id},
                    begin_date => PartialDate->new($self->data->{begin_date}),
                    end_date   => PartialDate->new($self->data->{end_date}),
                    type       => LinkType->new(
                        id => $self->data->{link_type_id},
                        link_phrase => $self->data->{link_type_phrase},
                        name => $self->data->{link_type_name},
                        reverse_link_phrase => $self->data->{reverse_link_type_phrase}
                    )
                ),
                direction => $MusicBrainz::Server::Entity::Relationship::DIRECTION_FORWARD
            ),
        } @{ $self->data->{links} }
    }
}

# Maps a relationship of a certain type to one (or more) relationships
my %end_point_map = (
# Example:
# Link type id 5 for artist-recording relationships is migrated as
# artist-recording and artist-work
# artist => {
#    recording => {
#        5 => [
#              type_0    type_1
#            [ 'artist', 'recording' ]
#            [ 'artist', 'work'      ]
#        ]
#    }
# }
 'album' => {
    'album' => {
        13 => [ [ 'release_group', 'release_group' ] ], # cover
        11 => [ [ 'release_group', 'release_group' ] ], # live performance
        8  => [ [ 'release_group', 'release_group' ] ], # compilations
        9  => [ [ 'release_group', 'release_group' ] ], # DJ-mix
        4  => [ [ 'release_group', 'release_group' ] ], # remixes
        7  => [ [ 'release_group', 'release_group' ] ], # remix
        5  => [ [ 'release_group', 'release_group' ] ], # mash-up
        18 => [ [ 'release_group', 'release_group' ] ], # single from
    },
    'artist' => {
        44 => [ [ 'artist', 'release_group' ] ], # tribute
        28 => [ [ 'artist', 'release_group' ] ], # artists and repertoire
        29 => [ [ 'artist', 'release_group' ] ], # creative direction
        34 => [ [ 'artist', 'release_group' ] ], # travel
    },
    'url' => {
        25 => [ [ 'release_group', 'url' ] ], # musicmoz
        16 => [ [ 'release_group', 'url' ] ], # discography
        23 => [ [ 'release_group', 'url' ] ], # wikipedia
        17 => [ [ 'release_group', 'url' ] ], # review
        36 => [ [ 'release_group', 'url' ] ], # ibdb
        37 => [ [ 'release_group', 'url' ] ], # iobdb
        27 => [ [ 'release_group', 'url' ] ], # IMDb
        38 => [ [ 'release_group', 'url' ] ], # lyrics
        41 => [ [ 'release_group', 'url' ] ], # recording studio
        42 => [ [ 'release_group', 'url' ] ], # score
    },
 },
 'artist' => {
    'track' => {
        13 => [ [ 'artist', 'work' ] ], # composition
        14 => [ [ 'artist', 'work' ] ], # composer
        16 => [ [ 'artist', 'work' ] ], # lyricist
        43 => [ [ 'artist', 'work' ] ], # instrumentator
        44 => [ [ 'artist', 'work' ] ], # orchestrator
        51 => [ [ 'artist', 'work' ] ], # librettist
        53 => [ [ 'artist', 'work' ] ], # writer
    },
 },
 'track' => {
    'track' => {
        4  => [ [ 'work', 'work' ] ],      # other version
# FIXME:
        5  => [                            # cover
            [ 'recording', 'work' ],
            [ 'work', 'work'      ],
        ],
        14 => [ [ 'recording', 'work' ] ], # medley
    },
    'url' => {
        18 => [ [ 'work', 'url' ] ], # other databases
        23 => [ [ 'work', 'url' ] ], # ibdb
        24 => [ [ 'work', 'url' ] ], # iobdb
        25 => [ [ 'work', 'url' ] ], # lyrics
        26 => [ [ 'work', 'url' ] ], # score
    },
 },
);

# ArtistID -> [ ArtistID ]
sub artist_ids        { shift; return ( shift ) }

# LabelID -> [ LabelID ]
sub label_ids         { shift; return ( shift ) }

# TrackID -> [ RecordingID ]
sub recording_ids     {
    my $self = shift;
    return ( $self->resolve_recording_id(shift) );
}

# AlbumID -> [ ReleaseID ]
sub release_ids       {
    my $self = shift;
    return @{ $self->album_release_ids(shift) };
}

# AlbumID -> [ ReleaseGroupID ]
sub release_group_ids {
    my $self = shift;
    return $self->find_release_group_id(
        $self->resolve_album_id(shift));
}

# UrlID -> [ UrlID ]
sub url_ids           { my $self = shift; return ( $self->resolve_url_id(shift) ) }

# TrackID -> [ WorkID ]
sub work_ids          { my $self = shift; return ( $self->resolve_work_id(shift) ) }

sub _expand_relationships {
    my ($self, $link_type_id,
        $entity0_type, $entity0_id,
        $entity1_type, $entity1_id) = @_;

    my $mappings = $end_point_map{$entity0_type}{$entity1_type}{$link_type_id} ||
        [ [
            upgrade_type($entity0_type),
            upgrade_type($entity1_type)
        ] ];

    return map {
        my ($mapped_type0, $mapped_type1) = @$_;
        my $map_0 = $mapped_type0 . '_ids';
        my $map_1 = $mapped_type1 . '_ids';
        map {
            my $mapped0_id = $_;
            map {
                my $mapped1_id = $_;
                +{
                    entity0_id   => $mapped0_id,
                    entity1_id   => $mapped1_id,
                    entity0_type => $mapped_type0,
                    entity1_type => $mapped_type1,
                    entity0_name => $self->new_value->{entity0name},
                    entity1_name => $self->new_value->{entity1name},
                }
            } $self->$map_1($entity1_id)
        } $self->$map_0($entity0_id)
    } @$mappings;
}

sub upgrade
{
    my $self = shift;

    $self->data({
        link_id          => $self->new_value->{linkid},
        link_type_id     => $self->new_value->{linktypeid},
        link_type_name   => $self->new_value->{linktypename},
        link_type_phrase => $self->new_value->{linktypephrase},
        reverse_link_type_phrase => $self->new_value->{rlinktypephrase},
        links            => [
            $self->_expand_relationships(
                $self->new_value->{linktypeid},
                $self->new_value->{entity0type} => $self->new_value->{entity0id},
                $self->new_value->{entity1type} => $self->new_value->{entity1id},
            )
        ],
        begin_date       => upgrade_date($self->new_value->{begindate}),
        end_date         => upgrade_date($self->new_value->{enddate}),
    });

    return $self;
}

1;
