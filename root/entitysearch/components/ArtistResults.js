// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const _ = require('lodash');
const React = require('react');

const WithPager = require('./WithPager');
const {l} = require('../../static/scripts/common/i18n');
const EntityLink = require('../../static/scripts/common/components/EntityLink');
const formatDate = require('../../static/scripts/common/utility/formatDate');
const isDateEmpty = require('../../static/scripts/common/utility/isDateEmpty');
const loopParity = require('../../utility/loopParity');

const ArtistResults = ({onPageClick, pager, query, results}) => (
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
              <th>{l('Sort Name')}</th>
              <th>{l('Type')}</th>
              <th>{l('Gender')}</th>
              <th>{l('Area')}</th>
              <th>{l('Begin')}</th>
              <th>{l('Begin Area')}</th>
              <th>{l('End')}</th>
              <th>{l('End Area')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}>
              <tr className={loopParity(index)}>
                <td>{result.score}</td>
                <td><EntityLink entity={result.entity} /></td>
                <td>{result.entity.sort_name}</td>
                <td>{_.get(result.entity, ['type', 'l_name'])}</td>
                <td>{_.get(result.entity, ['gender', 'l_name'])}</td>
                <td>
                  <If condition={result.entity.area}>
                    <EntityLink entity={result.entity.area} />
                  </If>
                </td>
                <td>{formatDate(result.entity.begin_date)}</td>
                <td>
                  <If condition={result.entity.begin_area}>
                    <EntityLink entity={result.entity.begin_area} />
                  </If>
                </td>
                <td>
                  <Choose>
                    <When condition={!isDateEmpty(result.entity.end_date)}>
                      {formatDate(result.entity.end_date)}
                    </When>
                    <When condition={result.entity.ended}>
                      {l('[unknown]')}
                    </When>
                  </Choose>
                </td>
                <td>
                  <If condition={result.entity.end_area}>
                    <EntityLink entity={result.entity.end_area} />
                  </If>
                </td>
              </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <p>
      {l('Alternatively, you may {uri|add a new artist}.', {
        __react: true,
        uri: '/artist/create?edit-artist.name=' + encodeURIComponent(query),
      })}
    </p>
  </frag>
);

module.exports = ArtistResults;
