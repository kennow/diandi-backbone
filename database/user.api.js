const Q = require('q');
const __MYSQL_API__ = require('./mysql.api');
const __STATEMENT__ = require('./user.sql.statement');
const __HELPER__ = require('../utility/helper');

function wechatMiniProgramLogin(request) {
    const deferred = Q.defer();
    const nonceStr = __HELPER__.getNonceStr(32);

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 根据 openid 查询用户是否存在
             */
            isRepeatSQL: __STATEMENT__.__IS_OPENID_REPEAT__,
            isRepeatParams: [
                request.openid
            ],
            /**
             *  2.1 如果不存在，新增
             */
            basicInsertSQL: __STATEMENT__.__ADD_MINI_PROGRAM_USER__,
            basicInsertParams: [{
                'openid': request.openid,
                'session_key': request.session_key,
                '3rd_session': nonceStr
            }],
            /**
             *  2.2 如果存在，更新用户表
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_MINI_PROGRAM_USER__,
            basicUpdateParams: [
                {
                    'openid': request.openid,
                    'session_key': request.session_key,
                    '3rd_session': nonceStr
                },
                request.openid
            ]
        })
        .then(__MYSQL_API__.beginTransaction)               //  启动事务
        .then(__MYSQL_API__.isRepeat)                       //  openid 是否已存在
        .then(
            __MYSQL_API__.basicInsert,                      //  不存在，新增
            __MYSQL_API__.basicUpdate                       //  存在，更新
        )
        .then(__MYSQL_API__.commitTransaction)              //  提交事务
        .then(__MYSQL_API__.cleanup)                        //  清理
        .then(function () {
            request.nonceStr = nonceStr;                    //  记录自定义登录态
            deferred.resolve(request);                      //  回传
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 *      新增收件人
 *
 * @param request
 * @returns {*|promise}
 */
function addConsignee(request) {
    const deferred = Q.defer();
    const consignee_no = __HELPER__.getNonceStr(32);

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.params.session
            ],
            /**
             *  2. 找到对应的 user_id
             */
            singleLineQuerySQL: __STATEMENT__.__FETCH_USER_INFO__,
            singleLineQueryParams: [
                request.params.session
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
                'name': request.body.name,
                'mobile': request.body.mobile,
                'address': request.body.address,
                'postcode': request.body.postcode,
                'isDefault': request.body.isDefault
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
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *  编辑收件人
 *
 * @param request
 * @returns {*|promise}
 */
function editConsignee(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.params.session
            ],
            /**
             *  2. 编辑收件人
             */
            basicUpdateSQL: __STATEMENT__.__EDIT_CONSIGNEE__,
            basicUpdateParams: [request.body.name, request.body.mobile, request.body.address, request.body.postcode, request.body.consignee_no]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicUpdate)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *   移除收件人
 *
 * @param request
 * @returns {*}
 */
function removeConsignee(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.params.session
            ],
            /**
             *  2. 删除收件人
             */
            deleteSQL: __STATEMENT__.__REMOVE_CONSIGNEE__,
            deleteParams: [request.body.consignee_no]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicDelete)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *      设置缺省收件人
 *
 * @param request
 * @returns {*|promise}
 */
function setAsDefaultConsignee(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.params.session
            ],
            /**
             *  2. 设置为缺省收件人
             */
            oneStepIndex: 0,
            oneStepSQLs: [
                __STATEMENT__.__SET_ALL_CONSIGNEE__,
                __STATEMENT__.__SET_SPECIFIC_CONSIGNEE__
            ],
            oneStepParams: [
                [0, request.params.session],
                [1, request.body.consignee_no]
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.executeInOrder)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *   获取缺省的收件人地址信息
 *
 * @param request
 * @returns {*|promise}
 */
function fetchDefaultConsignee(request) {
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
             *  2. 查询缺省收件人
             */
            basicQuerySQL: __STATEMENT__.__FETCH_DEFAULT_CONSIGNEE__,
            basicQueryParams: [
                request.session
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicQuery)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *   获取我的收件人信息列表
 *
 * @param request
 * @returns {*|promise}
 */
function fetchMyConsignee(request) {
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
             *  2. 查询收件人列表
             */
            basicQuerySQL: __STATEMENT__.__FETCH_MY_CONSIGNEE__,
            basicQueryParams: [
                request.session
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicQuery)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *      我的购物车
 *
 * @param request
 * @returns {*}
 */
function fetchMyCart(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'cart',
                'sku'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_MY_CART__,
                __STATEMENT__.__FETCH_PRODUCT_SKU__
            ],
            batchQueryParams: [                             //  对应参数
                [request.session],
                [request.session]
            ]
        })
        .then(__MYSQL_API__.inAll)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *   添加 / 更新
 *
 * @param request
 * @returns {*|promise}
 */
function addOrUpdate(request, sql) {
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
         *  2. 找到对应的 user_id
         */
        singleLineQuerySQL: __STATEMENT__.__FETCH_USER_INFO__,
        singleLineQueryParams: [
            request.session
        ],
        /**
         *  3. 加入购物车
         */
        xStepIndex: 0,
        xStepCount: 0,
        xStepSQLs: [],
        xStepParams: []
    };
    var cart = JSON.parse(request.cart);

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.singleLineQuery)
        .then(function (request) {
            var deferred = Q.defer();

            request.params.xStepCount = cart.length;
            for (var i = 0; i < request.params.xStepCount; i++) {
                // SQL语句
                request.params.xStepSQLs.push(__STATEMENT__.__CHECK_CART__);
                request.params.xStepSQLs.push(__STATEMENT__.__JOIN_TO_CART__);
                request.params.xStepSQLs.push(sql);
                // SQL语句的执行参数
                request.params.xStepParams.push([request.result.uid, cart[i].stock_no]);
                request.params.xStepParams.push({
                    user_id: request.result.uid,
                    stock_no: cart[i].stock_no,
                    amount: cart[i].amount
                });
                request.params.xStepParams.push([cart[i].amount, request.result.uid, cart[i].stock_no]);
            }
            deferred.resolve(request);
            return deferred.promise;
        })
        .then(__MYSQL_API__.executeStepX)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *   放入购物车
 * @param request
 * @returns {*|promise}
 */
function joinToCart(request) {
    return addOrUpdate(request, __STATEMENT__.__ADD_CART__)
}

/**
 *   更新购物车
 * @param request
 * @returns {*|promise}
 */
function updateMyCart(request) {
    return addOrUpdate(request, __STATEMENT__.__UPDATE_CART__)
}

/**
 *   从购物车中移除商品
 *
 * @param request
 * @returns {*}
 */
function removeMyCart(request) {
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
             *  2. 移除商品
             */
            deleteSQL: __STATEMENT__.__REMOVE_MY_CART__,
            deleteParams: [
                request.stock_no,
                request.session
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicDelete)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *      我的订单
 *
 * @param request
 * @returns {*}
 */
function fetchMyOrders(request) {
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
             *  2. 批量查询订单
             */
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'order',
                'sku'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_MY_ORDER__,
                __STATEMENT__.__FETCH_ORDER_SKU__
            ],
            batchQueryParams: [                             //  对应参数
                [request.session, request.startTime],
                [request.session, request.startTime]
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.inAll)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

module.exports = {
    // 小程序登录
    wechatMiniProgramLogin: wechatMiniProgramLogin,
    // 收件人
    addConsignee: addConsignee,
    editConsignee: editConsignee,
    removeConsignee: removeConsignee,
    setAsDefaultConsignee: setAsDefaultConsignee,
    fetchDefaultConsignee: fetchDefaultConsignee,
    fetchMyConsignee: fetchMyConsignee,
    // 购物车
    fetchMyCart: fetchMyCart,
    joinToCart: joinToCart,
    updateMyCart: updateMyCart,
    removeMyCart: removeMyCart,
    // 订单
    fetchMyOrders: fetchMyOrders
};

// wechatMiniProgramLogin({
//     session_key: 'xyUjCiulVSjZJY0ozZ+76w==',
//     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
// });

//fetchMyCart({
//    session: 'HJwC99VlJhgjN4yzLL3MuqhWIFlBlDwh'
//});