// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

function isDateEmpty(date) {
  return (
    date.year === null &&
    date.month === null &&
    date.day === null
  );
}

module.exports = isDateEmpty;
