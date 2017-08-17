// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2017 Timo Martikainen
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');

const WithPager = require('./WithPager');
const {l} = require('../../static/scripts/common/i18n');
const ArtistCreditLink = require('../../static/scripts/common/components/ArtistCreditLink');
const EntityLink = require('../../static/scripts/common/components/EntityLink');
const loopParity = require('../../utility/loopParity');
const {artistCreditFromArray} = require('../../static/scripts/common/immutable-entities');

const ReleaseResults = ({onPageClick, pager, query, results}) => (
  <frag>
    <If condition={results.length}>
      <WithPager
        onPageClick={onPageClick}
        pager={pager}
        query={query}
        search={true}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>{l('Score')}</th>
              <th>{l('Name')}</th>
              <th>{l('Artist')}</th>
              <th>{l('Format')}</th>
              <th>{l('Tracks')}</th>
              <th>{l('Date')}</th>
              <th>{l('Country')}</th>
              <th>{l('Label')}</th>
              <th>{l('Catalog#')}</th>
              <th>{l('Barcode')}</th>
              <th>{l('Language')}</th>
              <th>{l('Type')}</th>
              <th>{l('Status')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}> 
              <tr className={loopParity(index)}>              
                <td>{result.score}</td>
                <td><EntityLink entity={result.entity} /></td>
                <td><ArtistCreditLink artistCredit={artistCreditFromArray(result.entity.artistCredit)} showDeleted={false} /></td>
                <td>{result.entity.combined_format_name}</td>
                <td>{result.entity.combined_track_count}</td>
                <td>
                  <If condition={result.entity.dates}>
                    <ul className="links nowrap">
                      <For each="date" of={result.entity.dates}>
                        <li>
                          {date}
                        </li> 
                      </For>
                    </ul>
                  </If>
                </td>
                <td>
                  <If condition={result.entity.countries}>
                    <ul>
                      <For each="country" of={result.entity.countries}>
                        <li>
                          <span className={"flag flag-"+country.iso_3166_1_codes[0]}>
                            <abbr title={country.name}>
                              {country.iso_3166_1_codes[0]}
                            </abbr>
                          </span>
                        </li> 
                      </For>
                    </ul>
                  </If>
                </td>
                <td>
                  <If condition={result.entity.labels}>
                    <For each="label" index="index2" of={result.entity.labels}>
                      <If condition={index2 > 0}>, </If>
                        <EntityLink entity={label} />
                    </For>
                  </If>
                </td>
                <td>{result.entity.catNos}</td>
                <td>{result.entity.barcode}</td>
                <td>
                  {result.entity.language}
                  <If condition={result.entity.language && result.entity.script}> / </If>
                  {result.entity.script}
                </td>
                <td>{result.entity.groupType}</td>
                <td>{result.entity.l_status_name}</td>                
                </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new release}.', {
        __react: true,
        uri: '/release/add',
      })}
    </p>
  </frag>
);

module.exports = ReleaseResults;
