// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');

const WithPager = require('../../components/WithPager');
const {l} = require('../../static/scripts/common/i18n');
const DescriptiveLink = require('../../static/scripts/common/components/DescriptiveLink');
const formatDate = require('../../static/scripts/common/utility/formatDate');
const isDateEmpty = require('../../static/scripts/common/utility/isDateEmpty');
const primaryAreaCode = require('../../static/scripts/common/utility/primaryAreaCode');
const global = require('../../static/scripts/global');
const loopParity = require('../../utility/loopParity');

const AreaResults = ({onPageClick, pager, query, results}) => (
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
              <th>{l('Code')}</th>
              <th>{l('Begin')}</th>
              <th>{l('End')}</th>
            </tr>
          </thead>
          <tbody>
            <For each="result" index="index" of={results}>
              <tr className={loopParity(index)}>
                <td>{result.score}</td>
                <td>
                  <DescriptiveLink entity={result.entity} />
                </td>
                <td>{result.entity.l_type_name}</td>
                <td>{primaryAreaCode(result.entity)}</td>
                <td>{formatDate(result.entity.begin_date)}</td>
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
              </tr>
            </For>
          </tbody>
        </table>
      </WithPager>
    <Else />
      <p>{l('No results found. Try refining your search query.')}</p>
    </If>
    <If condition={global.$c && $c.user && $c.user.is_location_editor}>
      <p>
        {l('Alternatively, you may {uri|add a new area}.', {
          __react: true,
          uri: '/area/create?edit-area.name=' + encodeURIComponent(query),
        })}
      </p>
    </If>
  </frag>
);

module.exports = AreaResults;
