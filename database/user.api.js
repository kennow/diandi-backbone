const Q = require('q');
const __MYSQL_API__ = require('./mysql.base');
const __WX_PAY_HELPER__ = require('../services/wechat.pay/wechat.pay.helper');
const __SHOPPING_STATEMENT__ = require('./shopping.sql.statement');
const __STATEMENT__ = require('./user.sql.statement');
const __HELPER__ = require('../utility/helper');
const __CONFIG__ = require('./shopping.config');
const __MOMENT__ = require('moment');

/**
 *  微信小程序登录
 *
 * @param request
 * @returns {*|promise|C}
 */
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
            basicInsertSQL: __STATEMENT__.__ADD_USER__,
            basicInsertParams: [{
                'openid': request.openid,
                'session_key': request.session_key,
                '3rd_session': nonceStr
            }],
            /**
             *  2.2 如果存在，更新用户表
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_USER__,
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
            // request.nonceStr = nonceStr;                  //  记录自定义登录态
            deferred.resolve(nonceStr);                      //  回传
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 * 保存微信用户的user_info
 * @param request
 * @returns {*|promise|C}
 */
function saveWechatUserInfo(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 根据 openid 查询用户是否存在
             */
            isRepeatSQL: __STATEMENT__.__IS_WECHAT_USER_REPEAT__,
            isRepeatParams: [
                request.openid
            ],
            /**
             *  2.1 如果不存在，新增
             */
            basicInsertSQL: __STATEMENT__.__SAVE_USER_INFO__,
            basicInsertParams: [{
                'openid': request.openid,
                'nickname': request.nickname,
                'sex': request.sex,
                'headimgurl': request.headimgurl,
                'country': request.country,
                'province': request.province,
                'city': request.city,
                'unionid': request.unionid
            }],
            /**
             *  2.2 如果存在，更新用户表
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_USER_INFO__,
            basicUpdateParams: [
                {
                    'nickname': request.nickname,
                    'sex': request.sex,
                    'headimgurl': request.headimgurl,
                    'country': request.country,
                    'province': request.province,
                    'city': request.city,
                    'unionid': request.unionid
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
            deferred.resolve(request);                      //  透传参数
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 *    用3rd session 换取openid
 *
 * @param request
 * @returns {*|promise}
 */
function fetchUserOpenId(request) {
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
             *  2. 找到对应的 open_id
             */
            singleLineQuerySQL: __STATEMENT__.__FETCH_USER_INFO__,
            singleLineQueryParams: [
                request.session
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.singleLineQuery)
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
 *  验证用户身份信息
 *
 * @param request
 * @returns {*|promise|C}
 */
function checkIdentity(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ]
        })
        .then(__MYSQL_API__.checkSession)
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
 * 校验用户是否存在
 *      --      后台
 * @param request
 * @returns {*|C|promise}
 */
function checkMobile(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __STATEMENT__.__CHECK_MOBILE__,
            checkSessionParams: [
                request.phone
            ],
            /**
             *
             */
            basicQuerySQL: __STATEMENT__.__FETCH_USER_SESSION__,
            basicQueryParams: [
                request.phone
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
                'sku',
                'thumbnails'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_MY_CART__,
                __STATEMENT__.__FETCH_PRODUCT_SKU__,
                __STATEMENT__.__FETCH_MY_CART_THUMBNAILS__
            ],
            batchQueryParams: [                             //  对应参数
                [request.session],
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
 * 添加 / 更新
 * @param request
 * @param sql
 * @returns {*|promise|C}
 */
function addOrUpdate(request, sql) {
    const deferred = Q.defer();

    let params = {
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
    let cart = JSON.parse(request.cart);

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.singleLineQuery)
        .then(function (request) {
            const deferred = Q.defer();

            request.params.xStepCount = cart.length;
            for (let i = 0; i < request.params.xStepCount; i++) {
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
    return addOrUpdate(request, __STATEMENT__.__ADD_CART__);
}

/**
 *   更新购物车
 * @param request
 * @returns {*|promise}
 */
function updateMyCart(request) {
    return addOrUpdate(request, __STATEMENT__.__UPDATE_CART__);
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
 *      提交订单后，从购物车内删除要购买的商品（批量）
 *
 * @param request
 * @returns {*|C|promise}
 */
function updateMyCartAfterSubmit(request) {
    const deferred = Q.defer();

    let params = {
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *  2. 批量删除
         */
        batchQueryIndex: 0,                             //  索引
        batchQueryTag: [],                              //  标签
        batchQuerySQL: [],                              //  执行语句
        batchQueryParams: []                            //  对应参数
    };

    let skuList = JSON.parse(request.skuList);

    for (let i = 0, length = skuList.length; i < length; i++) {
        params.batchQueryTag.push('remove');
        params.batchQuerySQL.push(__STATEMENT__.__REMOVE_CART_ITEM__);
        params.batchQueryParams.push([
            skuList[i].stock_no, request.session
        ]);
    }

    __MYSQL_API__
        .setUpConnection(params)
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

//updateMyCartAfterSubmit({
//    session: 'nws0gPWe0ou1qruACzHbPxJJqbVQRedT',
//    skuList: '[{"stock_no":"0xflXpcSmSw8vW5bZumLIy4AsOIFFsK5","amount":1}]'
//});

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
                'sku',
                'thumbnails'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_MY_ORDER__,
                __STATEMENT__.__FETCH_ORDER_SKU__,
                __STATEMENT__.__FETCH_ORDER_THUMBNAILS__
            ],
            batchQueryParams: [                             //  对应参数
                [request.session, request.startTime],
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

/**
 *   提交退款申请
 *
 * @param request
 * @returns {*|promise}
 */
function submitRefund(request) {
    const deferred = Q.defer();
    const out_refund_no = __WX_PAY_HELPER__.generateRandomNO();
    let params = {
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *  2. 检查退款订单
         *     同一订单不能重复提交退款申请
         */
        isRepeatSQL: __STATEMENT__.__CHECK_REFUND__,
        isRepeatParams: [
            request.out_trade_no
        ],
        /**
         *  3. 提交退款申请，并记录退款订单的SKU
         */
        oneStepIndex: 0,
        oneStepSQLs: [
            __SHOPPING_STATEMENT__.__CHANGE_ORDER_STATUS__,
            __STATEMENT__.__SUBMIT_REFUND__
        ],
        oneStepParams: [
            [
                __CONFIG__.__ENUM_ORDER_STATUS__.REFUND,
                __MOMENT__().format('YYYY-MM-DD HH:mm:ss') + ' 用户申请退款',
                request.out_trade_no
            ],
            {
                out_refund_no: out_refund_no,
                out_trade_no: request.out_trade_no,
                refundFee: request.refundFee,
                totalFee: request.totalFee,
                status: __CONFIG__.__ENUM_REFUND_STATUS__.SUBMIT,
                reason: request.reason
            }
        ]
    };

    const skuList = JSON.parse(request.skuList);

    for (let i = 0; i < skuList.length; i++) {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_REFUND_SKU__);
        params.oneStepParams.push({
            out_refund_no: out_refund_no,
            stock_no: skuList[i]
        });
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.isRepeat)
        .then(__MYSQL_API__.executeInOrder)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            result.out_refund_no = out_refund_no;           //  带上退款单号
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
 *      获取用户的资料
 *          --  后台用
 *          --  微信账号信息
 *          --  收件人信息
 * @param request
 * @returns {*}
 */
function fetchUserInfo(request) {
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
             *  2. 检测用户权限
             */
            checkPermissionSQL: __STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'ORDER',
                'USER_INFO',
                request.session
            ],
            /**
             *  3. 批量查询订单
             */
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'user',
                'consignee'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_SPECIFIC_WECHAT__,
                __STATEMENT__.__FETCH_SPECIFIC_CONSIGNEE__
            ],
            batchQueryParams: [                             //  对应参数
                [request.user_id],
                [request.consignee_no]
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.checkPermission)
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
 *      获取用户列表
 *      --  即可查询所有用户，也可仅查询管理员
 * @param request
 * @returns {*|C|promise}
 */
function fetchUserList(request) {
    const deferred = Q.defer();

    let querySQL = '';
    if (request.hasOwnProperty('queryType') && request.queryType === 'MANAGER') {
        querySQL = __STATEMENT__.__FETCH_MANAGER__;
    } else {
        querySQL = __STATEMENT__.__FETCH_ALL_USER__;
    }

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
             *  2. 检测用户权限
             */
            checkPermissionSQL: __STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'USER',
                'QUERY',
                request.session
            ],
            /**
             *  3. 查询用户列表
             */
            basicQuerySQL: querySQL,
            basicQueryParams: []
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.checkPermission)
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
 *  添加角色权限
 * @param request
 * @returns {*|C|promise}
 */
function addRoleAction(request) {
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
             *  2. 添加权限
             */
            basicInsertSQL: __STATEMENT__.__ADD_ROLE_ACTION__,
            basicInsertParams: [{
                role_id: request.roleId,
                module: request.module,
                action: request.action
            }]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.basicInsert)
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

module.exports = {
    // 登录
    wechatMiniProgramLogin: wechatMiniProgramLogin,
    saveWechatUserInfo: saveWechatUserInfo,
    checkIdentity: checkIdentity,
    checkMobile: checkMobile,
    fetchUserOpenId: fetchUserOpenId,
    fetchUserInfo: fetchUserInfo,
    // 后台 - 管理员
    fetchUserList: fetchUserList,
    addRoleAction: addRoleAction,
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
    updateMyCartAfterSubmit: updateMyCartAfterSubmit,
    // 订单
    fetchMyOrders: fetchMyOrders,
    // 发起退款申请
    submitRefund: submitRefund
};

// wechatMiniProgramLogin({
//     session_key: 'xyUjCiulVSjZJY0ozZ+76w==',
//     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
// });

// fetchMyCart({
//    session: 'VSoh6vxnomXFcO95DfI7kYyYQT5DSjZH'
// });