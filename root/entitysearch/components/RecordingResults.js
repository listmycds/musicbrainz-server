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

const RecordingResults = ({onPageClick, pager, query, results}) => (
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
              <th className="video c"></th>
              <th>{l('Name')}</th>
              <th className="treleases">{l('Length')}</th>
              <th>{l('Artist')}</th>
              <th>{l('Release')}</th>
              <th>{l('Track')}</th>
              <th>{l('Medium')}</th>
              <th>{l('Type')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" of={results}> 
              <For each="release" index="index" of={result.entity.releases}>
                <tr className={loopParity(index)}>              
                  <If condition={index==0}>
                    <td>{result.score}</td>
                    <If condition={result.entity.video}>
                      <td className="video c is-video" title={l('This recording is a video')}></td> 
                    <Else />
                      <td className="video c"></td>
                    </If>
                    <td><EntityLink entity={result.entity} /></td>
                    <td>{result.entity.length}</td>
                    <td><ArtistCreditLink artistCredit={artistCreditFromArray(result.entity.artistCredit)} showDeleted={false} /></td>
                  <Else />
                    <td colSpan="5">&#xa0;</td>
                  </If>
                  <td><EntityLink entity={release} /></td>
                  <td>{release.position}/{release.trackCount}</td>
                  <td>{release.medium}</td>
                  <td>{release.groupType}</td>
                </tr>
              </For>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new recording}.', {
        __react: true,
        uri: '/recording/create?edit-recording.name=' + encodeURIComponent(query),
      })}
    </p>
  </frag>
);

module.exports = RecordingResults;
