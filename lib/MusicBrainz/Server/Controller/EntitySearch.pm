package MusicBrainz::Server::Controller::EntitySearch;
use Moose;
use MusicBrainz::Server::Translation qw( l lp );
use MusicBrainz::Server::Constants qw( entities_with );
use MusicBrainz::Server::Data::Utils qw( model_to_type );
use MusicBrainz::Server::Form::Utils qw(
    select_options
    script_options
    language_options
    build_grouped_options
);
BEGIN { extends 'MusicBrainz::Server::Controller' }

sub entitysearch : Path('') {
    my ($self, $c) = @_;
    
    my %option_data;
    for my $model (qw(
        ArtistType
        EventType
        Gender
        InstrumentType
        LabelType
        MediumFormat
        PlaceType
        ReleaseGroupSecondaryType
        ReleaseGroupType
        ReleaseStatus
        SeriesType
        WorkType
    )) {
        $option_data{model_to_type($model)} = [
            map +{ label => $_->l_name, value => lc $_->name },
            $c->model($model)->get_all
        ];
    }
    
    $option_data{entity} = [grep { $_ ne 'url' } entities_with(['mbid' , 'relatable'])];
    $option_data{country} = select_options(
        $c, 'CountryArea',
        serializer => sub {
            return { label => $_[0]->l_name, value => $_[0]->country_code };
        }
    );
    
    $option_data{language} = build_grouped_options($c, language_options($c));
    $option_data{script} = build_grouped_options($c, script_options($c));
          
    $c->stash( 
        template => 'entitysearch/index.tt',
        option_data => \%option_data,
    );    
}

1;

=head1 LICENSE

Copyright (C) 2015 Thanuditha Ruchiranga

This software is provided "as is", without warranty of any kind, express or
implied, including  but not limited  to the warranties of  merchantability,
fitness for a particular purpose and noninfringement. In no event shall the
authors or  copyright  holders be  liable for any claim,  damages or  other
liability, whether  in an  action of  contract, tort  or otherwise, arising
from,  out of  or in  connection with  the software or  the  use  or  other
dealings in the software.

GPL - The GNU General Public License    http://www.gnu.org/licenses/gpl.txt
Permits anyone the right to use and modify the software without limitations
as long as proper  credits are given  and the original  and modified source
code are included. Requires  that the final product, software derivate from
the original  source or any  software  utilizing a GPL  component, such  as
this, is also licensed under the GPL license.
=cut
