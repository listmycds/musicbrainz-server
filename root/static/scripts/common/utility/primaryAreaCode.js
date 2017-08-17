// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

function primaryAreaCode(area) {
  if (area.iso_3166_1_codes.length === 1) {
    return area.iso_3166_1_codes[0];
  }
  if (area.iso_3166_2_codes.length === 1) {
    return area.iso_3166_2_codes[0];
  }
  if (area.iso_3166_3_codes.length === 1) {
    return area.iso_3166_3_codes[0];
  }
  return null;
}

module.exports = primaryAreaCode;
