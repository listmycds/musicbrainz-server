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

const ReleaseGroupResults = ({onPageClick, pager, query, results}) => (
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
              <th>{l('Release Group')}</th>
              <th>{l('Artist')}</th>
              <th>{l('Type')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}> 
              <tr className={loopParity(index)}>              
                <td>{result.score}</td>
                <td><EntityLink entity={result.entity} /></td>
                <td><ArtistCreditLink artistCredit={artistCreditFromArray(result.entity.artistCredit)} showDeleted={false} /></td>
                <td>{result.entity.l_type_name}</td> 
              </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new release group}.', {
        __react: true,
        uri: '/release_group/create?edit-release-group.name=' + encodeURIComponent(query),
      })}
    </p>
  </frag>
);

module.exports = ReleaseGroupResults;
