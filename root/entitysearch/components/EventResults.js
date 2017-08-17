// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2017 Timo Martikainen
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');

const WithPager = require('./WithPager');
const {l} = require('../../static/scripts/common/i18n');
const EntityLink = require('../../static/scripts/common/components/EntityLink');
//const formatDate = require('../../static/scripts/common/utility/formatDate');
//const isDateEmpty = require('../../static/scripts/common/utility/isDateEmpty');
const loopParity = require('../../utility/loopParity');

const EventResults = ({onPageClick, pager, query, results}) => (
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
              <th>{l('Type')}</th>
              <th>{l('Artists')}</th>
              <th>{l('Location')}</th>
              <th>{l('Date')}</th>
              <th>{l('Time')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}>
              <tr className={loopParity(index)}>
                <td>{result.score}</td>
                <td><EntityLink entity={result.entity} /></td>
                <td>{result.entity.type.l_name}</td>
                <td>
                  <If condition={result.entity.performers}>
                    <ul>
                      <For each="rel_artist" of={result.entity.performers}>
                        <li>
                          <EntityLink entity={rel_artist.entity} /> ({rel_artist.roles.join(', ')})
                        </li>
                      </For>
                    </ul>
                  </If>                
                </td>
                <td>
                  <If condition={result.entity.places || result.entity.areas}>
                    <ul>
                      <If condition={result.entity.places}>
                        <For each="place" of={result.entity.places}>
                          <li>
                            <EntityLink entity={place} />
                          </li>
                        </For>
                      </If>
                      <If condition={result.entity.areas}>
                        <For each="area" of={result.entity.areas}>
                          <li>
                            <EntityLink entity={area} />
                          </li>
                        </For>
                      </If>
                    </ul>
                  </If>
                </td>
                <td>{result.entity.formatted_date}</td>
                <td>{result.entity.formatted_time}</td>
              </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new event}.', {
        __react: true,
        uri: '/event/create?edit-event.name=' + encodeURIComponent(query),
      })}
    </p>
  </frag>
);

module.exports = EventResults;
