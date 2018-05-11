const Q = require('q');
const __HELPER__ = require('../utility/helper');
const __MYSQL_API__ = require('./mysql.api');
const __STATEMENT__ = require('./shopping.sql.statement');
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.api.js');

/**
 *      新增收件人
 * @param request
 * @param response
 * @returns {*|promise}
 */
function addConsignee(request, response) {
    const deferred = Q.defer();
    const consignee_no = __HELPER__.getNonceStr(32);

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 找到对应的 user_id
             */
            singleLineQuerySQL: __STATEMENT__.__FETCH_USER_INFO__,
            singleLineQueryParams: [
                request.session
            ],
            /**
             *  3. 调整参数
             */
            modifyParamsKey: 'basicInsertParams',
            modifyParamsAttribute: 'user_id',
            /**
             *  4. 新增收件人
             */
            basicInsertSQL: __STATEMENT__.__ADD_NEW_CONSIGNEE__,
            basicInsertParams: [{
                'consignee_no': consignee_no,
                'user_id': 0,
                'name': request.name,
                'mobile': request.mobile,
                'address': request.address,
                'postcode': request.postcode,
                'isDefault': request.isDefault
            }]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.singleLineQuery)
        .then(__MYSQL_API__.modifyRequestParams)
        .then(__MYSQL_API__.basicInsert)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            response(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, response);
        });

    return deferred.promise;
}

/**
 *      设置缺省收件人
 * @param request
 * @param response
 * @returns {*|promise}
 */
function setAsDefaultConsignee(request, response) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 新增收件人
             */
            oneStepIndex: 0,
            oneStepSQLs: [
                __STATEMENT__.__SET_ALL_CONSIGNEE__,
                __STATEMENT__.__SET_SPECIFIC_CONSIGNEE__
            ],
            oneStepParams: [
                [0, request.session],
                [1, request.consignee_no]
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.executeInOrder)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            response(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, response);
        });

    return deferred.promise;
}

function addStockAttribute(request, response) {
    __MYSQL_API__
        .setUpConnection(request)
        .then(__MYSQL_API__.beginTransaction)
        // .then()
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            response(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, response);
        });
}

/**
 *      新增商品
 *  同时更新SKU表、 Product表及 rel_product_attribute_value表
 *
 * @param request
 * @param response
 */
function addNewProduct(request, response) {

}

module.exports = {
    addStockAttribute: addStockAttribute,
    addConsignee: addConsignee,
    setAsDefaultConsignee: setAsDefaultConsignee
};

addStockAttribute({
    a: [1, 2, 3],
    b: [6, 7]
}, function (result) {
    __LOGGER__.info(result);
});

// addConsignee({
//     session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//     name: '测试二',
//     mobile: '18120995333',
//     address: '测试二',
//     postcode: '351111',
//     isDefault: 0
// }, function (result) {
//     __LOGGER__.info(result);
// });

// setAsDefaultConsignee({
//     session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//     consignee_no: 'Scej48lVN4cpfSwgRNvWnfZUZeUNpk7H'
// }, function (result) {
//     __LOGGER__.info(result);
// });