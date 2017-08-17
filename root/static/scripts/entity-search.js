// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2017 Timo Martikainen
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import {l} from './common/i18n';
import m from './common/utility/getScriptArgs';
var option_data = m();
import Autocomplete from './common/components/Autocomplete';
import getPager from './entity-search/utility/getPager';
import { cleanWebServiceResults } from './common/utility/cleanWebServiceData';
import { escapeLuceneValue } from './common/utility/search';
import { isDateValid } from './edit/utility/dates';

import AreaResults from '../../entitysearch/components/AreaResults';
import ArtistResults from '../../entitysearch/components/ArtistResults';
import EventResults from '../../entitysearch/components/EventResults';
import InstrumentResults from '../../entitysearch/components/InstrumentResults';
import LabelResults from '../../entitysearch/components/LabelResults';
import PlaceResults from '../../entitysearch/components/PlaceResults';
import RecordingResults from '../../entitysearch/components/RecordingResults';
import ReleaseResults from '../../entitysearch/components/ReleaseResults';
import ReleaseGroupResults from '../../entitysearch/components/ReleaseGroupResults';
import SeriesResults from '../../entitysearch/components/SeriesResults';
import WorkResults from '../../entitysearch/components/WorkResults';

function init_entity_search() {
  ReactDOM.render(<Content />, document.getElementById('content'));
}

const RemoveButton = ({value, title, handler}) =>
  <button
    value={value}
    className="nobutton icon remove-item"
    onClick={handler}
    title={title}
    type="button"
  />;

const EntitySelector = (props) => {
  let entities = {};
  option_data.entity.sort().map((entity) => {
    entities[entity] = _.endsWith(entity, 's') ? _.startCase(entity) : _.startCase(entity) + 's';
  });
  return (
    <select name="entity-selector" value={props.selectedEntity} onChange={props.onChange}>
      {Object.keys(entities).map((key) =>
        <option value={key}>{l(entities[key])}</option>
      )}
    </select>
  );
};

const CombinatorSelector = (props) =>
  <select name="combinator" onChange={props.onChange}>
    <option value="AND">{l('all')}</option>
    <option value="OR">{l('any')}</option>
  </select>;

const NegationSelector = (props) =>
  <Choose>
    <When condition={props.negationDisabled}>
      <select name="negation" disabled>
        <option value="0">{l('is')}</option>
      </select>
    </When>
    <Otherwise>
      <select name="negation" onChange={props.onChange}>
        <option value="0">{l('is')}</option>
        <option value="1">{l('is not')}</option>
      </select>
    </Otherwise>
  </Choose>;

const NegationMatchSelector = (props) => // todo: investigate if this feature is possible to be implemented
  <select name="negation" disabled>
    <option value="0">{l('match')}</option>
  </select>;

const TypeSelector = (props) =>
  <select defaultValue={props.selected} onChange={props.typeHandler} data-start={props.start} data-index={props['data-index']}>
    <If condition={props.start}>
      <option value="start">
        {l('Please choose a condition')}
      </option>
    </If>
    {props.types.map((type) =>
      <option value={type.value}>{l(type.label)}</option>
    )}
  </select>;

class DateField extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = {
      year: '',
      month: '',
      day: ''
    };
  }

  onChange(event) {
    const input = event.target.value;

    if (_.isEmpty(input) || _.isFinite(_.parseInt(input))) {
      const part = event.target.name; // either year, month or day

      const stateOb = this.state;
      stateOb[part] = input;

      // WS doesn't allow year or year-month or month agnostic queries
      if (_.isEmpty(input)) {
        if (part === 'year') {
          stateOb.month = '';
          stateOb.day = '';
        } else if (part === 'month') {
          stateOb.day = '';
        }
      }

      this.setState(stateOb);
    }
    this.props.setDate(this.state.year, this.state.month, this.state.day)
  }

  render() {
    const props = this.props;
    const year = this.state.year;
    const month = this.state.month;
    const day = this.state.day;

    return(
      <frag>
        <input
            className="partial-date-year"
            maxLength="4"
            name="year"
            onChange={this.onChange}
            placeholder={l('YYYY')}
            value={year}
        />
        {'-'}
        <input
          className="partial-date-month"
          disabled={!this.state.year}
          maxLength="2"
          name="month"
          onChange={this.onChange}
          placeholder={l('MM')}
          value={month}
        />
        {'-'}
        <input
          className="partial-date-day"
          disabled={!this.state.month}
          maxLength="2"
          name="day"
          onChange={this.onChange}
          placeholder={l('DD')}
          value={day}
        />
      </frag>
    );
  }

}

class DateRangeField extends React.Component {
  constructor(props) {
    super(props);
    this.onNegationChange = this.onNegationChange.bind(this);
    this.setFromDate = this.setFromDate.bind(this);
    this.setToDate = this.setToDate.bind(this);
    this.state = {
      from: '',
      to: '',
      invalidTo: false,
      invalidFrom: false,
      negation: '',
      input: '',
      termId: this.props['data-index'],
      termType: this.props['data-field']
    };
  }

  getLastDayOfMonth(year, month) {
    const daysInMonth = {
      'true':  [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
      'false': [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    const isLeapYear = year % 400 ? (year % 100 ? !(year % 4) : false) : true;

    return daysInMonth[isLeapYear.toString()][month];
  }

  validDate(year, month, day, choice) {
    let date = '';

    const intYear = year, intMonth = month, intDay = day;

    if (month && month < 10) month = '0' + month;
    if (day && day < 10) day = '0' + day;

    if (year && (!month && !day) && choice.indexOf('To') > -1) {
      date = year + '-12-31'; // without this would return dates which don't have year set
    } else {
      date = year ? (month ? (day ? year + '-' + month + '-' + day : year + '-' + month ) : year) : '';
    }

    // for example 1980-1 - 1980-1 => 1980-1-1 - 1980-1-31
    if ((year && month) && !day && choice.indexOf('From') > -1) {
      date = `${year}-${month}-01`;
    }
    if ((year && month) && !day && choice.indexOf('To') > -1) {
      date = `${year}-${month}-${this.getLastDayOfMonth(intYear, intMonth)}`;
    }

    let stateOb = this.state;

    // choice is either invalidFrom or invalidTo (2 input fields)
    if (_.isEmpty(date)) {
      stateOb[choice] = false; // empty field implies "any"
      return date;
    }

    if (isDateValid(intYear, intMonth, intDay)) {
      stateOb[choice] = false;
      this.setState(stateOb);
      return date;
    } else {
      stateOb[choice] = true;
      this.setState(stateOb);
      return false;
    }
  }

  setFromDate(year, month, day) {
    const date = this.validDate(year, month, day, 'invalidFrom');
    if (date !== false) {
      this.setState({from: date}, this.updateState);
    }
  }

  setToDate(year, month, day) {
    const date = this.validDate(year, month, day, 'invalidTo');
    if (date !== false) {
      this.setState({to: date}, this.updateState);
    }
  }

  updateState() {
    const from = this.state.from;
    const to = this.state.to;
    let value = '';

    if (from && !to) {
      value = `[${from} TO null]`;
    } else if (from && to) {
      value = `[${from} TO ${to}]`;
    } else if (!from && to) {
      value = `[* TO ${to}]`;
    }

    if (value.length) {
      this.props.queryHandler(this.state.termId, `${this.state.negation}${this.state.termType}`, value);
    }

  }

  onNegationChange(event) {
    const negation = !!+event.target.value ? '-': '';
    this.setState({ negation: negation }, this.updateState);
  }

  render() {
    const props = this.props;

    return(
      <frag>
        <TypeSelector selected={props.selectedType} types={props.types} typeHandler={props.typeHandler} />
        <NegationSelector onChange={this.onNegationChange} negationDisabled={props.negationDisabled}/>
        {l('From')}
        <DateField setDate={this.setFromDate} />
        {l('To')}
        <DateField setDate={this.setToDate} />
        {(this.state.invalidFrom || this.state.invalidTo) &&
          <div>{l('Please enter a valid date.')}</div>
        }
      </frag>
    );
  }

}

class NumberField extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onNegationChange = this.onNegationChange.bind(this);
    this.state = {
      invalidInput: false,
      negation: '',
      input: '',
      termId: this.props['data-index'],
      termType: this.props['data-field']
    };
  }

  onNegationChange(event) {
    const negation = !!+event.target.value ? '-': '';
    this.setState({ negation: negation });
    this.props.queryHandler(this.state.termId, `${negation}${this.state.termType}`, this.state.input);
  }

  onChange(event) {
    const input = event.target.value.replace(/ /g, '');
    const termId = event.target.dataset.index;
    const termType = event.target.dataset.field;

    if (/^\d+$/.test(input)) { // if a single number
      this.setState({
        invalidInput: false,
        input: input
      });
      this.props.queryHandler(termId, `${this.state.negation}${termType}`, input);
    } else if (/^\d+-\d+$/.test(input)) { // if range
      const splitNumbers = _.words(input, /\d+/g);
      const option = `[${splitNumbers[0]} TO ${splitNumbers[1]}]`;
      this.setState({
        invalidInput: false,
        input: option
      });
      this.props.queryHandler(termId, `${this.state.negation}${termType}`, option);
    } else if (_.isEmpty(input)) {
      this.setState({
        invalidInput: false,
        input: ''
      });
      this.props.queryHandler(termId, `${this.state.negation}${termType}`, input);
    } else {
      this.setState({
        invalidInput: true,
        input: ''
      });
      this.props.queryHandler(termId, `${this.state.negation}${termType}`, input);
    }
  }

  render() {
    var props = this.props;
    return(
      <frag>
        <TypeSelector selected={props.selectedType} types={props.types} typeHandler={props.typeHandler} />
        <NegationSelector onChange={this.onNegationChange} negationDisabled={props.negationDisabled} />
        <input type="text" onChange={this.onChange} data-index={props['data-index']} data-field={props['data-field']} />
        {this.state.invalidInput &&
          <div className="valid-string">
            {l('Please enter a valid number or range.')}
          </div>}
      </frag>
    );
  }

}

class OptionField extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onNegationChange = this.onNegationChange.bind(this);
    this.state = { negation: '' };
  }

  onNegationChange(event) {
    const negation = !!+event.target.value ? '-': '';
    this.setState({ negation: negation });
    this.props.queryHandler(this.state.termId, `${negation}${this.state.termType}`, `${escapeLuceneValue(this.state.input)}`);
  }

  onChange(event) {
    const termId = event.target.dataset.index;
    const termType = event.target.dataset.field;
    const input = event.target.value;
    this.setState({
      termId: termId,
      termType: termType,
      input: input
    });
    this.props.queryHandler(termId, `${this.state.negation}${termType}`, `${escapeLuceneValue(input)}`);
  }

  componentWillMount() {
    let input = '';
    if (this.props.options[0].optgroup) {
      input = this.props.options[0].options[0].value;
    } else {
      input = this.props.options[0].value;
    }
    const termId = this.props['data-index'];
    const termType = this.props['data-field'];
    this.setState({
      termId: termId,
      termType: termType,
      input: input
    });
    this.props.queryHandler(termId, termType, `"${escapeLuceneValue(input)}"`);
  }

  render() {
    var props = this.props;
    return(
      <frag>
        <TypeSelector selected={props.selectedType} types={props.types} typeHandler={props.typeHandler} data-index={props['data-index']} />
        <NegationSelector onChange={this.onNegationChange} negationDisabled={props.negationDisabled} />
        <select name={props.id} onChange={this.onChange} data-index={props['data-index']} data-field={props['data-field']} >
        <Choose>
          <When condition={props.options[0].optgroup}>
            {props.options.map((optgroup, i) =>
              <optgroup label={l(optgroup.optgroup)}>
                {optgroup.options.map((opt, i) =>
                  <option value={opt.value}>{l(opt.label)}</option>
                )}
              </optgroup>
            )}
          </When>
          <Otherwise>
            {props.options.map((opt, i) =>
              <option value={opt.value}>{l(opt.label)}</option>
            )}
          </Otherwise>
        </Choose>
        </select>
      </frag>
    );
  }
}

class TextField extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onNegationChange = this.onNegationChange.bind(this);
    this.state = {
      negation: '',
      input: '',
      termId: this.props['data-index'],
      termType: this.props['data-field']
    };
  }

  onChange(event) {
    const termId = event.target.dataset.index;
    const termType = event.target.dataset.field;
    const input = event.target.value;
    this.setState({
      termId: termId,
      termType: termType,
      input: input
    });
    this.props.queryHandler(termId, `${this.state.negation}${termType}`, `${escapeLuceneValue(input)}`);
  }

  onNegationChange(event) {
    const negation = !!+event.target.value ? '-': '';
    this.setState({ negation: negation });
    this.props.queryHandler(this.state.termId, `${negation}${this.state.termType}`, `${escapeLuceneValue(this.state.input)}`);
  }

  render() {
    var props = this.props;
    return(
      <frag>
        <TypeSelector selected={props.selectedType} types={props.types} typeHandler={props.typeHandler} data-index={props['data-index']} />
        <NegationSelector onChange={this.onNegationChange} negationDisabled={props.negationDisabled} />
        <input type="text" onChange={this.onChange} data-index={props['data-index']} data-field={props['data-field']}/>
      </frag>
    );
  }

}

const Conditions = (props) =>
  <ul className="conditions">
    {props.conditions.map((condition) =>
      <li className="condition" key={condition.id}>
        <RemoveButton value={condition.id} title={l('Delete')} handler={props.removehandler} />
        {React.cloneElement(condition.component, { negationDisabled: props.negationDisabled })}
      </li>
    )}
  </ul>;


const SearchResults = (props) => {
  const currentEntity = props.entity;
  const queryFailed = props.queryFailed;

  const pager = getPager({
    currentPage: props.currentPage,
    entriesPerPage: 25,
    totalEntries: props.results.count
  });

  const data = currentEntity !== 'all' ? props.results[_.endsWith(currentEntity, 's') ? currentEntity : currentEntity + 's'] : null;
  const results = cleanWebServiceResults(data || [], _.snakeCase(currentEntity));

  props = {
    onPageClick: props.onPageClick,
    pager: pager,
    query: '',
    results: results
  };

  return (
    <frag>
      <If condition={!queryFailed}>
        <Choose>
          <When condition={currentEntity === 'area'}>
            <AreaResults {...props} />
          </When>
          <When condition={currentEntity === 'artist'}>
            <ArtistResults {...props} />
          </When>
          <When condition={currentEntity === 'event'}>
            <EventResults {...props} />
          </When>
          <When condition={currentEntity === 'instrument'}>
            <InstrumentResults {...props} />
          </When>
          <When condition={currentEntity === 'label'}>
             <LabelResults {...props} />
          </When>
          <When condition={currentEntity === 'place'}>
            <PlaceResults {...props} />
          </When>
          <When condition={currentEntity === 'recording'}>
            <RecordingResults {...props} />
          </When>
          <When condition={currentEntity === 'instrument'}>
            <InstrumentResults {...props} />
          </When>
          <When condition={currentEntity === 'release_group'}>
            <ReleaseGroupResults {...props} />
          </When>
          <When condition={currentEntity === 'release'}>
            <ReleaseResults {...props} />
          </When>
          <When condition={currentEntity === 'series'}>
            <SeriesResults {...props} />
          </When>
          <When condition={currentEntity === 'work'}>
            <WorkResults {...props} />
          </When>
          <Otherwise>
            <h2>Searches for this entity are not yet supported.</h2>
          </Otherwise>
        </Choose>
      </If>
    </frag>
  );
};

class Content extends React.Component {
  constructor(props) {
    super(props);
    this.onCombinatorChange = this.onCombinatorChange.bind(this);
    this.onEntityChange = this.onEntityChange.bind(this);
    this.onNegationChange = this.onNegationChange.bind(this);
    this.onPageClick = this.onPageClick.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);
    this.removeCondition = this.removeCondition.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleQueryChanges = this.handleQueryChanges.bind(this);

    if (option_data.language) { // todo: move this to Perl Controller
      option_data.language.map((optgroup) => {
        optgroup.options.map((opt) => {
          opt.value=opt.code;
          delete opt.code;
        })
      })
    }

    if (option_data.script) { // todo: move this to Perl Controller
      option_data.script.map((optgroup) => {
        optgroup.options.map((opt) => {
          opt.value=opt.code;
          delete opt.code;
        })
      })
    }

    const releaseQuality = [{value: 'low', label: l('Low')}, {value: 'normal', label: l('Normal')}, {value: 'high', label: l('High') }];
    this.options = {
      area:            [{ value: 'area',          label: 'Name',                component: <TextField /> },
                        { value: 'begin',         label: 'Begin Date',          component: <DateRangeField /> },
                        { value: 'end',           label: 'End Date',            component: <DateRangeField /> }],
      artist:          [{ value: 'artist',        label: 'Name',                component: <TextField /> },
                        { value: 'begin',         label: 'Born/Founded',        component: <DateRangeField /> },
                        { value: 'country',       label: 'Country',             component: <OptionField options={option_data.country} /> },
                        { value: 'end',           label: 'Died/Dissolved',      component: <DateRangeField /> },
                        { value: 'gender',        label: 'Gender',              component: <OptionField options={option_data.gender} /> },
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.artist_type} /> }],
      event:           [{ value: 'begin',         label: 'Begin Date',          component: <DateRangeField /> },
                        { value: 'end',           label: 'End Date',            component: <DateRangeField /> },
                        { value: 'event',         label: 'Name',                component: <TextField /> },
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.event_type} /> }],
      instrument:      [{ value: 'instrument',    label: 'Name',                component: <TextField /> },
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.instrument_type} /> }],
      label:           [{ value: 'begin',         label: 'Begin Date',          component: <DateRangeField /> },
                        { value: 'end',           label: 'End Date',            component: <DateRangeField /> },
                        { value: 'label',         label: 'Name',                component: <TextField />},
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.label_type} /> }],
      place:           [{ value: 'begin',         label: 'Begin Date',          component: <DateRangeField /> },
                        { value: 'end',           label: 'End Date',            component: <DateRangeField /> },
                        { value: 'place',         label: 'Name',                component: <TextField /> },
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.place_type} /> }],
      recording:       [{ value: 'country',       label: 'Country',             component: <OptionField options={option_data.country} /> },
                        { value: 'date',          label: 'Release Date',        component: <DateRangeField /> },
                        { value: 'duration',      label: 'Duration',            component: <NumberField /> },
                        { value: 'format',        label: 'Medium Format',       component: <OptionField options={option_data.medium_format} /> },
                        { value: 'primarytype',   label: 'Primary Type',        component: <OptionField options={option_data.release_group_type} /> },
                        { value: 'recording',     label: 'Name',                component: <TextField /> },
                        { value: 'secondarytype', label: 'Secondary Type',      component: <OptionField options={option_data.release_group_secondary_type} /> },
                        { value: 'status',        label: 'Status',              component: <OptionField options={option_data.release_status} /> },
                        { value: 'tracks',        label: 'Medium Track Count',  component: <NumberField /> },
                        { value: 'tracksrelease', label: 'Release Track Count', component: <NumberField /> }],
      release:         [{ value: 'country',       label: 'Country',             component: <OptionField options={option_data.country} /> },
                        { value: 'date',          label: 'Release Date',        component: <DateRangeField /> },
                        { value: 'format',        label: 'Medium Format',       component: <OptionField options={option_data.medium_format} /> },
                        { value: 'lang',          label: 'Language',            component: <OptionField options={option_data.language} /> },
                        { value: 'mediums',       label: 'Medium Count',        component: <NumberField /> },
                        { value: 'quality',       label: 'Quality',             component: <OptionField options={releaseQuality} /> },
                        { value: 'release',       label: 'Name',                component: <TextField /> },
                        { value: 'script',        label: 'Script',              component: <OptionField options={option_data.script} /> },
                        { value: 'status',        label: 'Status',              component: <OptionField options={option_data.release_status} /> },
                        { value: 'tracksrelease', label: 'Track Count',         component: <NumberField /> }],
      'release-group': [{ value: 'primarytype',   label: 'Primary Type',        component: <OptionField options={option_data.release_group_type} /> },
                        { value: 'releases',      label: 'Number of Releases',  component: <NumberField /> },
                        { value: 'releasegroup',  label: 'Name',                component: <TextField /> },
                        { value: 'secondarytype', label: 'Secondary Type',      component: <OptionField options={option_data.release_group_secondary_type} /> },
                        { value: 'status',        label: 'Status',              component: <OptionField options={option_data.release_status} /> }],
      series:          [{ value: 'series',        label: 'Name',                component: <TextField /> },
                        { value: 'type',          label: 'Type',                component: <OptionField options={option_data.series_type} /> }],
      work:            [{ value: 'type',          label: 'Type',                component: <OptionField options={option_data.work_type} /> },
                        { value: 'lang',          label: 'Lyrics Language',     component: <OptionField options={option_data.language} /> },
                        { value: 'work',          label: 'Name',                component: <TextField /> }]
    };

    this.state = { selectedEntity: 'artist',
                   conditions: [{ id: 0, component: <TypeSelector start={true} types={this.options.artist} typeHandler={this.onTypeChange} /> }],
                   id: 0,
                   queryTerms: {},
                   results: {},
                   queryFailed: true,
                   currentPage: 1,
                   combinator: 'AND',
                   temporary: option_data,
                   negationDisabled: true
    };

    for (var entity in this.options) {
      for (var i = 0; i < this.options[entity].length; i++) {
        this.options[entity][i].component = React.cloneElement(
          this.options[entity][i].component, {
            typeHandler: this.onTypeChange,
            queryHandler: this.handleQueryChanges,
            negationDisabled: this.state.negationDisabled // this doesn't seem to work as expected
          }
        );
      }
    }

  }

  onCombinatorChange(event) {
    this.setState({ combinator: event.target.value });
  }

  onEntityChange(event) {
    this.setState({ selectedEntity: event.target.value,
                    conditions: [{ id: 0, component: <TypeSelector start={true} types={this.options[event.target.value]} typeHandler={this.onTypeChange} />}],
                    id: 0,
                    queryTerms: {},
                    results: {},
                    queryFailed: true,
                    currentPage: 1,
                    negationDisabled: true
    });
  }

  onNegationChange(event) {
  }

  onTypeChange(event) {
    const selectedType = event.target.value;
    const selectedEntity = this.state.selectedEntity;
    const newID = this.state.id + 1;
    const OptionsIndex = _.findIndex(this.options[selectedEntity], o => o.value == selectedType);
    const ConditionIndex = _.findIndex(this.state.conditions, i => i.id == event.target.dataset.index);
    if (event.target.dataset.start) { // = "Please choose a condition" component on the list
      this.setState({ id: newID }, () => {
        this.setState((prevState) => ({
          conditions: [
            ...prevState.conditions.slice(0, prevState.conditions.length - 1),
            { id: newID,
              component: React.cloneElement(this.options[selectedEntity][OptionsIndex].component, {
                id: selectedType.concat(newID),
                'data-index': newID,
                'data-field': selectedType,
                types: this.options[selectedEntity],
                selectedType: selectedType,
              })
            },
            prevState.conditions[prevState.conditions.length - 1]
          ]
        }));
      });

      if (this.state.conditions.length > 1) {
        this.setState({ negationDisabled: false });
      }

      event.target.value='start';
    } else {
      const ConditionIndex = _.findIndex(this.state.conditions, i => i.id == event.target.dataset.index);
      var temp = this.state.conditions;
      temp[ConditionIndex] = {
        id: temp[ConditionIndex].id,
        component: React.cloneElement(
          this.options[selectedEntity][OptionsIndex].component, {
            id: selectedType.concat(newID),
            'data-index': temp[ConditionIndex].id,
            'data-field': selectedType,
            types: this.options[selectedEntity],
            selectedType: selectedType,
          }
        )
      };
      this.setState({ conditions: temp });

      const tempTerms = this.state.queryTerms;
      delete tempTerms[temp[ConditionIndex].id];
      this.setState({ queryTerms: tempTerms });

      if (this.state.conditions.length > 1) {
        this.setState({ negationDisabled: false });
      }

      }
  }

  onPageClick(page) {
    this.setState({ currentPage: page}, () => {
      this.getResults();
    });
  }

  removeCondition(event) {
    const selected = parseInt(event.target.value, 10);
    const i = _.findIndex(this.state.conditions, i => i.id == selected);

    if (selected > 0) { // if not "Please choose a condition" component
      // disabling netagation selector and updating if negation found from terms
      // because Lucene doesn't support NOT searches with only one term
      if (this.state.conditions.length <= 3) {
        this.setState({ negationDisabled: true });

        const queryTerms = this.state.queryTerms;
        const key = _.keys(queryTerms)[0];
        if (_.startsWith(queryTerms[key].type, '-')) {
          queryTerms[key].type = queryTerms[key].type.substring(1)
        }
        this.setState({ queryTerms: queryTerms });
      }
      // removing condition from the list
      this.setState((prevState) => ({
        conditions: [...prevState.conditions.slice(0,i), ...prevState.conditions.slice(i+1)]
      }));
      // removing query terms related to removed condition
      const tempTerms = this.state.queryTerms;
      delete tempTerms[selected];
      this.setState({ queryTerms: tempTerms });
    }

  }

  handleQueryChanges(termId, termType, termValue) {
    if (termValue.length) {
      const tempTerms = this.state.queryTerms;
      tempTerms[termId] = { type: termType, value: termValue };
      this.setState({ queryTerms: tempTerms });
    } else {
      const tempTerms = this.state.queryTerms;
      delete tempTerms[termId];
      this.setState({ queryTerms: tempTerms });
    }
  }

  handleClick() {
    this.getResults();
  }

  getResults() {
    const baseUrl = `/ws/2/${this.state.selectedEntity}?fmt=json&query=`;

    const queryTerms = _.values(this.state.queryTerms);
    const combinator = this.state.combinator;

    // todo: what to do if there's no search conditions?

    var query = queryTerms.map(t => `${t.type}:${t.value}`).join(` ${combinator} `);

    const offset = `&offset=${((this.state.currentPage - 1) * 25)}`;

    const url = baseUrl + query + offset;

    $.ajax({
      url: url,
      dataType: 'json',
      cache: false,
      success: (data) => {
        this.setState({ results: data,
                        queryFailed: false });
      },
      error: (request, status, err) => {
        this.setState({ results: {},
                        queryFailed: true });
      }
    });

  }

  render() {
    return(
      <frag>
        <h1>{l('Search for Entities')}</h1>
        <p>
          {l('Show me')}
          <EntitySelector selectedEntity={this.state.selectedEntity} onChange={this.onEntityChange}/>
          {l('that')}
          <NegationMatchSelector />
          <CombinatorSelector onChange={this.onCombinatorChange} />
          {l('of the following conditions:')}
        </p>
        <Conditions conditions={this.state.conditions} removehandler={this.removeCondition} negationDisabled={this.state.negationDisabled} />
        <span className="buttons"><button type="button" onClick={this.handleClick}>{l('Search')}</button></span>
        <SearchResults
          onPageClick={this.onPageClick}
          results={this.state.results}
          entity={this.state.selectedEntity}
          queryFailed={this.state.queryFailed}
          currentPage={this.state.currentPage}
          />
      </frag>
    );
  }

}

init_entity_search();
