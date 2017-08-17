// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

function loopParity(x) {
  return x % 2 === 0 ? 'even' : 'odd';
}

module.exports = loopParity;
