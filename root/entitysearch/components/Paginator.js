// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const {range} = require('lodash');
const React = require('react');

const {l} = require('../static/scripts/common/i18n');
const uriWith = require('../utility/uriWith');

function linkProps(onClick, page, pageVar) {
  if (onClick) {
    return {
      href: '#',
      onClick(event) {
        event.preventDefault();
        onClick(page);
      },
    };
  } else {
    return {href: uriWith({[pageVar]: page})};
  }
}

const Paginator = ({
  guessSearch = false,
  onPageClick,
  pager,
  pageVar = 'page',
}) => {
  if (!pager || pager.last_page <= 1) {
    return null;
  }

  function pageLink(page, text, selected = false) {
    const props = linkProps(onPageClick, page, pageVar);
    if (selected) {
      props.className = 'sel';
    }
    return <a {...props}>{text}</a>;
  }

  const start = (pager.current_page - 4) > 0 ? (pager.current_page - 4) : 1;
  const end = (pager.current_page + 4) < pager.last_page ? (pager.current_page + 4) : pager.last_page;

  return (
    <nav>
      <ul className="pagination">
        <li>
          <If condition={pager.previous_page}>
            {pageLink(pager.previous_page, l('Previous'))}
          <Else />
            <span>{l('Previous')}</span>
          </If>
        </li>

        <li className="separator" />

        <If condition={start > pager.first_page}>
          <li>{pageLink(pager.first_page, pager.first_page)}</li>
        </If>

        <If condition={start > (pager.first_page + 1)}>
          <li><span>{l('…')}</span></li>
        </If>

        <For each="page" of={range(start, end + 1)}>
          <li>
            <If condition={pager.current_page === page}>
              {pageLink(page, <strong>{page}</strong>, true)}
            <Else />
              {pageLink(page, page)}
            </If>
          </li>
        </For>

        <If condition={end < (pager.last_page - 1)}>
          <li><span>{l('…')}</span></li>
        </If>

        <If condition={end < pager.last_page}>
          <li>{pageLink(pager.last_page, pager.last_page)}</li>
        </If>

        <If condition={guessSearch}>
          <li><span>{l('…')}</span></li>
        </If>

        <li className="separator" />

        <li>
          <If condition={pager.next_page}>
            {pageLink(pager.next_page, l('Next'))}
          <Else />
            <span>{l('Next')}</span>
          </If>
        </li>
      </ul>
    </nav>
  );
};

module.exports = Paginator;
