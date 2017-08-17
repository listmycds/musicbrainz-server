var request = require('../utility/request.js');

var specialLuceneChars = /([+\-&|!(){}[\]^"~*?:\\\/])/g;

exports.escapeLuceneValue = function (value) {
    return String(value).replace(specialLuceneChars, "\\$1");
};

exports.constructLuceneField = function (values, key) {
    return key + ":(" + values.join(" OR ") + ")";
}

exports.constructLuceneFieldConjunction = function (params) {
    return _.map(params, exports.constructLuceneField).join(" AND ");
};


exports.search = function (resource, query, limit, offset) {
    var requestArgs = {
        url: "/ws/2/" + resource,
        data: {
            fmt: "json",
            query: query
        }
    };

    if (limit !== undefined) requestArgs.data.limit = limit;

    if (offset !== undefined) requestArgs.data.offset = offset;

    return request(requestArgs);
};