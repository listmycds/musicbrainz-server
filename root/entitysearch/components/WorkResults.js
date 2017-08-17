// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2017 Timo Martikainen
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');

const WithPager = require('./WithPager');
const {l} = require('../../static/scripts/common/i18n');
const EntityLink = require('../../static/scripts/common/components/EntityLink');
const loopParity = require('../../utility/loopParity');

const WorkResults = ({onPageClick, pager, query, results}) => (
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
              <th>{l('Writers')}</th>
              <th>{l('Type')}</th>
              <th>{l('Language')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}>
              <tr className={loopParity(index)}>
                <td>{result.score}</td>
                <td><EntityLink entity={result.entity} /></td>
                <td>
                  <If condition={result.entity.writers}>
                    <ul>
                      <For each="rel_artist" index="index" of={result.entity.writers}>
                        <li>
                          <EntityLink entity={rel_artist.entity} /> ({rel_artist.roles.join(', ')})
                        </li>
                      </For>
                    </ul>
                  </If>
                </td>
                <td>{result.entity.type.l_name}</td>
                <td>{result.entity.languages}</td>     
              </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new work}.', {
        __react: true,
        uri: '/work/create?edit-work.name=' + encodeURIComponent(query),
      })}
    </p>
  </frag>
);

module.exports = WorkResults;
