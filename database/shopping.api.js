const Q = require('q');
const __HELPER__ = require('../utility/helper');
const __MYSQL_API__ = require('./mysql.api');
const __STATEMENT__ = require('./shopping.sql.statement');
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.api.js');

function executeInOrderPlus(request) {
    var i,
        length,
        promise,
        tasks = [];

    // 放进执行列表
    for (i = 0, length = request.params.oneStepSQLs.length; i < length; i++) {
        tasks.push(__MYSQL_API__.isRepeatPlus);     //  检查属性值是否重复
        tasks.push(__MYSQL_API__.oneStep);          //  执行添加
    }

    promise = Q(request);

    for (i = 0, length = tasks.length; i < length; i++) {
        promise = promise.then(tasks[i]);
    }

    return promise;
}

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
            resultKey: 'uid',
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

/**
 *      新增SKU属性值
 * @param request
 * @param response
 */
function addStockAttribute(request, response) {

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
                 *  2. 新增SKU属性
                 */
                basicInsertSQL: __STATEMENT__.__ADD_NEW_SKU_ATTRIBUTE__,
                basicInsertParams: [{
                    name: request.name
                }]
            }
        )
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicInsert)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            response(result.params);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, response);
        });
}

/**
 *      批量新增SKU属性值
 * @param request
 * @param response
 * @returns {*|promise}
 */
function batchAddNewStockValue(request, response) {
    const deferred = Q.defer();
    var params = {
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *  2. 批量新增SKU属性值
         */
        oneStepIndex: 0,
        isRepeatSQL: __STATEMENT__.__CHECK_SKU_VALUE__,
        isRepeatParams: [],
        oneStepSQLs: [],
        oneStepParams: []
    };
    /**
     *  构建批量插入的参数
     */
    for (var i = 0, length = request.values.length; i < length; i++) {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_NEW_SKU_VALUE__);
        params.isRepeatParams.push([request.values[i].value, request.values[i].aid]);
        params.oneStepParams.push(request.values[i]);
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(executeInOrderPlus)
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
 *      新增商品
 *
 *  同时更新SKU表、 Product表及 rel_product_attribute_value表
 *
 * @param request
 * @param response
 */
function createNewProduct(request, response) {
    const deferred = Q.defer();
    const productId = __HELPER__.getNonceStr(32);
    var params = {
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *  2. 新增商品
         */
        basicInsertSQL: __STATEMENT__.__ADD_NEW_PRODUCT__,
        basicInsertParams: [{
            pid: productId,
            name: request.name,
            description: request.description
        }],
        /**
         *  3. 批量新增商品与属性、属性值间的关系
         */
        oneStepIndex: 0,
        oneStepSQLs: [],
        oneStepParams: []
    };

    for (var i = 0; i < request.attributes.length; i++) {
        for (var j = 0; j < request.attributes[i].values.length; j++) {
            __LOGGER__.debug('KEY: ' + request.attributes[i].key + ' | VALUE: ' + request.attributes[i].values[j]);
            params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_PRODUCT_ATTR_VALUE__);
            params.oneStepParams.push({
                pid: productId,
                aid: request.attributes[i].key,
                vid: request.attributes[i].values[j]
            });
        }
    }

    for (var k = 0; k < request.skuList.length; k++) {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_NEW_SKU__);
        params.oneStepParams.push({
            stock_no: __HELPER__.getNonceStr(32),
            unit: request.skuList[k].unit,
            stock: request.skuList[k].stock,
            attributes: request.skuList[k].attributes,
            product_id: productId
        });
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicInsert)
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

module.exports = {
    addStockAttribute: addStockAttribute,
    addConsignee: addConsignee,
    setAsDefaultConsignee: setAsDefaultConsignee
};

createNewProduct({
        session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
        name: 'Test',
        description: 'Test',
        attributes: [
            {key: 3, values: [6, 7]},
            {key: 1, values: [2, 4, 5]}
        ],
        skuList: [
            {unit: 1, stock: 10, attributes: '1,3'},
            {unit: 2, stock: 10, attributes: '1,4'},
            {unit: 3, stock: 10, attributes: '1,5'},
            {unit: 4, stock: 10, attributes: '2,3'},
            {unit: 5, stock: 10, attributes: '2,4'},
            {unit: 6, stock: 10, attributes: '2,5'}
        ]
    },
    function (result) {
        __LOGGER__.info(result);
    }
)
;
// addStockAttribute({
//     session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//     name: '颜色'
// }, function (result) {
//     __LOGGER__.info(result);
// });

// batchAddNewStockValue({
//     session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//     values: [
//         {
//             value: 'Red',
//             aid: '3'
//         },
//         {
//             value: 'White',
//             aid: '3'
//         }
//     ]
// }, function (result) {
//     __LOGGER__.info(result);
// });

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