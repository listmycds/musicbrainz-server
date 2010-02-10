package MusicBrainz::Server::Form::Role::DatePeriod;
use HTML::FormHandler::Moose::Role;

use Date::Calc;

has_field 'begin_date' => (
    type => '+MusicBrainz::Server::Form::Field::PartialDate',
);

has_field 'end_date' => (
    type => '+MusicBrainz::Server::Form::Field::PartialDate',
);

after 'validate' => sub {
    my $self = shift;
    my $begin = $self->field('begin_date')->value;
    my $end   = $self->field('end_date')->value;

    return if $self->field('begin_date')->has_errors;
    return if $self->field('end_date')->has_errors;

    return 1 unless $begin->{year} && $end->{year};

    my ($days) = Date::Calc::Delta_Days(
        $begin->{year}, $begin->{month} || 1, $begin->{day} || 1,
        $end->{year},   $end->{month} || 1,   $end->{day} || 1
    );

    if ($days < 0) {
        return $self->field('end_date')->add_error('The end date must occur on or after the begin date');
    }

    return 1;
};

1;
