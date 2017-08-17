// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const {range} = require('lodash');
const React = require('react');

const {ln} = require('../static/scripts/common/i18n');
const uriWith = require('../utility/uriWith');
const Paginator = require('./Paginator');

const WithPager = ({
  children,
  guessSearch,
  onPageClick,
  pager,
  pageVar,
  query,
  search,
  total,
}) => {
  const paginatorElement = (
    <Paginator
      guessSearch={guessSearch}
      onPageClick={onPageClick}
      pager={pager}
      pageVar={pageVar}
    />
  );

  return (
    <frag>
      {paginatorElement}
      <If condition={search || total}>
        <p className="pageselector-results">
          <If condition={total || query === ''}>
            {ln(
              'Found {n} result',
              'Found {n} results',
              pager.total_entries,
              {n: Number(pager.total_entries).toLocaleString()},
            )}
          <Else />
            {ln(
              'Found {n} result for "{q}"',
              'Found {n} results for "{q}"',
              pager.total_entries,
              {n: Number(pager.total_entries).toLocaleString(), q: query}
            )}
          </If>
        </p>
      </If>
      {children}
      {paginatorElement}
    </frag>
  );
};

module.exports = WithPager;
