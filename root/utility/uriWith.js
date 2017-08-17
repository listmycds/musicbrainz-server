// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2016 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const {assign} = require('lodash');
const querystring = require('querystring');
const url = require('url');

function uriWith(newQueryParams) {
  let urlObj = url.parse($c.req.url, true);
  let queryObj = querystring.parse(urlObj.query);
  assign(queryObj, newQueryParams);
  urlObj.query = querystring.stringify(queryObj);
  urlObj.search = '?' + urlObj.query;
  return url.format(urlObj);
}

module.exports = uriWith;
