/* Copyright (C) 2009 Oliver Charles
   Copyright (C) 2010 MetaBrainz Foundation

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
*/

MB.utility.displayedValue = function(element) {
    if(element.is('select')) {
        return element.find(':selected').text();
    }
    else if (element.is('input[type=text]')) {
        return element.val();
    }
};

MB.utility.noOp = function(event) {
    event.preventDefault();
};

MB.utility.template = function(str) {
    var self = MB.Object();

    var draw = function (o) {
        return str.replace(/#{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
    };

    self.draw = draw;

    return self;
};

MB.utility.autocomplete = {};
MB.utility.autocomplete.options = {
    "minChars": 1,
    "highlight": false,
    "width": "20em",
    "formatItem": function(row, i, max) {
        return row.name +
            (row.comment ? ' <span class="autocomplete-comment">(' + row.comment + ")</span>" : "")
    },
    "formatMatch": function(row, i, max) {
        return row.name;
    },
    "parse": function (rows) {
        var parsed = [];
        for (var i=0; i < rows.length; i++) {
            var row = rows[i];
            parsed[parsed.length] = {
                data: row,
                value: row.gid,
                result: row
            };
        }
    return parsed;
    }
};

