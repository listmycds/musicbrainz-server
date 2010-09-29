package MusicBrainz::Server::Edit::Historic::AddRelease;
use Moose;
use MooseX::Types::Structured qw( Dict Optional );
use MooseX::Types::Moose qw( ArrayRef Int Str );
use MusicBrainz::Server::Constants qw( $EDIT_HISTORIC_ADD_RELEASE );
use MusicBrainz::Server::Data::Utils qw( partial_date_from_row );
use MusicBrainz::Server::Edit::Historic::Utils qw( upgrade_date upgrade_id upgrade_type_and_status );
use MusicBrainz::Server::Edit::Types qw( Nullable PartialDateHash );

extends 'MusicBrainz::Server::Edit::Historic';

sub edit_name     { 'Add release' }
sub historic_type { 16 }
sub edit_type     { $EDIT_HISTORIC_ADD_RELEASE }
sub edit_template { 'historic/add_release' }

has '+data' => (
    isa => Dict[
        release_ids => ArrayRef[Int],
        name        => Str,
        freedb_id   => Optional[Str],
        cd_index_id => Optional[Str],
        disc_id     => Optional[Str],
        toc         => Optional[Str],
        status_id   => Nullable[Int],
        type_id     => Nullable[Int],
        artist_id   => Int,
        script_id   => Nullable[Int],
        language_id => Nullable[Int],
        tracks      => ArrayRef[Dict[
            position     => Int,
            recording_id => Int,
            name         => Str,
            length       => Nullable[Int],
            artist_id    => Int
        ]],
        release_events => ArrayRef[Dict[
            country_id     => Nullable[Int],
            date           => PartialDateHash,
            label_id       => Nullable[Int],
            catalog_number => Nullable[Str],
            barcode        => Nullable[Str],
            format_id      => Nullable[Int],
        ]]
    ]
);

sub _recording_ids
{
    my $self = shift;
    return map { $_->{recording_id} } @{ $self->data->{tracks} };
}

sub _release_ids
{
    my $self = shift;
    return @{ $self->data->{release_ids} };
}

sub _artist_ids
{
    my $self = shift;
    return map { $_->{artist_id} } @{ $self->data->{tracks} };
}

sub _release_events
{
    my $self = shift;
    return @{ $self->data->{release_events} };
}

sub _tracks
{
    my $self = shift;
    return @{ $self->data->{tracks} };
}

sub related_entities
{
    my $self = shift;
    return {
        recording => [ $self->_recording_ids ],
        release   => [ $self->_release_ids ]
    }
}

sub foreign_keys
{
    my $self = shift;
    return {
        Artist        => [ $self->_artist_ids ],
        Country       => [ map { $_->{country_id} } $self->_release_events ],
        Label         => [ map { $_->{label_id} } $self->_release_events ],
        Language      => [ $self->data->{language_id} ],
        MediumFormat  => [ map { $_->{format_id} } $self->_release_events ],
        Recording     => [ $self->_recording_ids ],
        Release       => [ $self->_release_ids ],
        ReleaseStatus => [ $self->data->{status_id} ],
        ReleaseGroupType => [ $self->data->{type_id} ],
        Script        => [ $self->data->{script_id} ],
    };
}

sub build_display_data
{
    my ($self, $loaded) = @_;
    return {
        name           => $self->data->{name},
        artist         => $loaded->{Artist}->{ $self->data->{artist_id} },
        releases       => [ map { $loaded->{Release}->{ $_ } } $self->_release_ids ],
        status         => $loaded->{ReleaseStatus}->{ $self->data->{status_id} },
        type           => $loaded->{ReleaseGroupType}->{ $self->data->{type_id} },
        language       => $loaded->{Language}->{ $self->data->{language_id} },
        script         => $loaded->{Script}->{ $self->data->{script_id} },
        release_events => [
            map { +{
                country        => $loaded->{Country}->{ $_->{country_id} },
                date           => partial_date_from_row( $_->{date} ),
                label          => $loaded->{Label}->{ $_->{label_id} },
                catalog_number => $_->{catalog_number},
                barcode        => $_->{barcode},
                format         => $loaded->{MediumFormat}->{ $_->{format_id} }
            } } $self->_release_events
        ],
        tracks => [
            map { +{
                name      => $_->{name},
                artist    => $loaded->{Artist}->{ $_->{artist_id} },
                length    => $_->{length},
                position  => $_->{position},
                recording => $loaded->{Recording}->{ $_->{recording_id} }
            } } sort { $a->{position} <=> $b->{position} } $self->_tracks
        ]
    }
}

our %status_map = (
    100 => 1,
    101 => 2,
    102 => 3,
    104 => 4,
);

sub upgrade
{
    my ($self) = @_;

    my $release_artist_id = $self->new_value->{_artistid};

    my $data = {
        name           => $self->new_value->{AlbumName},
        artist_id      => $release_artist_id,
        release_events => [],
        release_ids    => [],
        tracks         => []
    };

    if (my $attributes = $self->new_value->{Attributes}) {
        my ($type_id, $status_id) = upgrade_type_and_status($attributes);
        $data->{status_id} = $status_id;
        $data->{type_id} = $type_id;
    }

    if (my $language = $self->new_value->{Language}) {
        my ($language_id, $script_id) = split /,/, $language;
        $data->{language_id} = upgrade_id($language_id);
        $data->{script_id}   = upgrade_id($script_id);
    }

    for (my $i = 0; 1; $i++) {
        my $release_event = $self->new_value->{"Release$i"}
            or last;

        my $release_event_id = $self->new_value->{"Release$i" . 'Id'};
        my ($country_id, $date, $label_id, $catalog_number, $barcode, $format_id) =
            split /,/, $release_event;

        push @{ $data->{release_events} }, {
            country_id     => upgrade_id($country_id),
            date           => upgrade_date($date),
            label_id       => upgrade_id($label_id),
            catalog_number => $catalog_number,
            barcode        => $barcode,
            format_id      => upgrade_id($format_id)
        };

        push @{ $data->{release_ids} }, ($self->resolve_release_id($release_event_id) || ());
    }

    unless (@{ $data->{release_ids} }) {
        $data->{release_ids} = $self->album_release_ids($self->new_value->{_albumid});
    }

    for (my $i = 1; 1; $i++) {
        my $track_name = $self->new_value->{"Track$i"}
            or last;

        my $artist_id = $self->new_value->{"ArtistID$i"} ||
            $release_artist_id;

        my $length = $self->new_value->{"TrackDur$i"};
        my $track_id = $self->new_value->{'Track' . $i . 'Id'};

        push @{ $data->{tracks} }, {
            position     => $i,
            name         => $track_name,
            artist_id    => $artist_id,
            length       => $length,
            recording_id => $self->resolve_recording_id($track_id)
        }
    }

    $self->data($data);
    return $self;
}

__PACKAGE__->meta->make_immutable;
no Moose;
1;
