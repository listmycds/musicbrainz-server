// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2017 Timo Martikainen
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

const React = require('react');
const Layout = require('../layout');
const {l} = require('../static/scripts/common/i18n');

const _search = (props) => ( 
  <Layout {...props} title={l('Search')} fullWidth={true}>
    <div id="content" />
  </Layout>
);

module.exports = _search; 
