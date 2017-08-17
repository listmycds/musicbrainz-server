// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

// Partially emulates the Data::Page API in JavaScript:
// http://search.cpan.org/~lbrocard/Data-Page-2.02/lib/Data/Page.pm

function getPager({currentPage, entriesPerPage, totalEntries}) {
  const lastPage = getLastPage(entriesPerPage, totalEntries);

  return {
    current_page: currentPage,
    entries_per_page: entriesPerPage,
    first_page: 1,
    last_page: lastPage,
    next_page: currentPage < lastPage ? currentPage + 1 : null,
    previous_page: currentPage > 1 ? currentPage - 1 : null,
    total_entries: totalEntries,
  };
}

function getLastPage(entriesPerPage, totalEntries) {
  const pages = totalEntries / entriesPerPage;
  let lastPage;

  if (pages === Math.trunc(pages)) {
    lastPage = pages;
  } else {
    lastPage = 1 + Math.trunc(pages);
  }

  if (lastPage < 1) {
    lastPage = 1;
  }

  return lastPage;
}

module.exports = getPager;
