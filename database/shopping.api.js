const __MYSQL_API__ = require('./mysql.api');
const __STATEMENT__ = require('./shopping.sql.statement');
const __LOGGER__ = require("../services/log4js.service").getLogger("default");

var api = {

    addStockAttribute: function (request, response) {
        __MYSQL_API__
            .setUpConnection({})
            .then(__MYSQL_API__.beginTransaction)
            .then(__MYSQL_API__.commitTransaction)
            .then(__MYSQL_API__.cleanup)
            .then(function (result) {
                response(result);
            })
            .catch(function (request) {
                __MYSQL_API__.onRejectWithRollback(request, response);
            })
    }
};

module.exports = api;

api.addStockAttribute({}, function (result) {
    __LOGGER__.info(result);
});