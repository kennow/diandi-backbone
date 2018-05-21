const Q = require('q');
const __HELPER__ = require('../utility/helper');
const __MYSQL_API__ = require('./mysql.api');
const __CONFIG__ = require('./shopping.config');
const __STATEMENT__ = require('./shopping.sql.statement');
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.api.js');

/**
 *      新增SKU属性值
 * @param request
 */
function addStockAttribute(request) {
    var deferred = Q.defer();

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
            deferred.resolve(result.params);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *      批量新增SKU属性值
 * @param request
 * @returns {*|promise}
 */
function batchAddNewStockValue(request) {
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
        oneStepParams: [],
        oneStepPlusFn: __MYSQL_API__.isRepeatPlus
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
        .then(__MYSQL_API__.executeInOrderPlus)
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
 *      新增商品
 *
 *  同时更新SKU表、 Product表及 rel_product_attribute_value表
 *
 * @param request
 */
function createNewProduct(request) {
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

    /**
     *  表 rel_product_attribute_value
     */
    for (var i = 0; i < request.attributes.length; i++) {
        for (var j = 0; j < request.attributes[i].values.length; j++) {
            params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_PRODUCT_ATTR_VALUE__);
            params.oneStepParams.push({
                pid: productId,
                aid: request.attributes[i].key,
                vid: request.attributes[i].values[j]
            });
        }
    }

    /**
     *  表 tb_sku
     */
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
 * 提交订单
 * @param request
 * @returns {*|promise}
 */
function submitNewOrder(request) {
    const deferred = Q.defer();
    var params = {
        /**
         *  1. 生成预支付订单
         */
        basicInsertSQL: __STATEMENT__.__ADD_NEW_ORDER__,
        basicInsertParams: [{
            out_trade_no: request.order.out_trade_no,
            user_id: request.order.user_id,
            consignee_no: request.order.consignee_no,       //  订单收件人ID
            totalFee: request.order.totalFee,               //  订单总金额
            attach: request.order.attach,                   //  用户留言
            prepayID: request.order.prepayID                //  微信支付prepay_id
        }],
        /**
         *  2. 更新库存，并添加关联
         */
        checkStockSQL: __STATEMENT__.__CHECK_STOCK__,
        checkStockParams: [],
        checkStockAmount: [],
        oneStepIndex: 0,
        oneStepSQLs: [],
        oneStepParams: [],
        oneStepPlusFn: __MYSQL_API__.checkStock
    };

    for (var i = 0; i < request.order.skuList.length; i++) {
        params.checkStockParams.push(request.order.skuList[i].stock_no);        //  检查商品库存
        params.checkStockParams.push(request.order.skuList[i].stock_no);        //  再次检查商品库存，避免因并发而出现的库存为负的情况
        params.checkStockAmount.push(request.order.skuList[i].amount);
        params.checkStockAmount.push(0);
        params.oneStepSQLs.push(__STATEMENT__.__UPDATE_STOCK__);                //  更新商品库存
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_ORDER_SKU__);           //  添加订单与SKU表间的关联
        params.oneStepParams.push([request.order.skuList[i].amount, request.order.skuList[i].stock_no]);
        params.oneStepParams.push({
            out_trade_no: request.order.out_trade_no,
            stock_no: request.order.skuList[i].stock_no,
            amount: request.order.skuList[i].amount
        });
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.basicInsert)                //  生成预支付订单
        .then(__MYSQL_API__.executeInOrderPlus)
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
 *      关闭订单
 *
 * @param request
 * @returns {*|promise}
 */
function closeOrder(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicUpdateSQL: __STATEMENT__.__CHANGE_ORDER_STATUS__,
            basicUpdateParams: [__CONFIG__.__ENUM_ORDER_STATUS__.CLOSE, request.out_trade_no]
        })
        .then(__MYSQL_API__.beginTransaction)
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
 *      支付成功后更新订单
 *
 * @param request
 * @returns {*|promise}
 * @constructor
 */
function updateOrderAfterPay(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            xStepIndex: 0,
            xStepCount: 1,
            xStepSQLs: [
                __STATEMENT__.__CHECK_CONSISTENCY__,
                __STATEMENT__.__UPDATE_ORDER_AFTER_PAY__,
                __STATEMENT__.__UPDATE_ORDER_AFTER_PAY__
            ],
            xStepParams: [
                [request.out_trade_no, request.total_fee],
                [
                    request.bank_type,
                    request.mch_id,
                    request.trade_type,
                    request.transaction_id,
                    request.time_end,
                    __CONFIG__.__ENUM_ORDER_STATUS__.ABNORMAL,
                    '异常：订单金额与实际支付金额不一致',
                    request.out_trade_no
                ],
                [
                    request.bank_type,
                    request.mch_id,
                    request.trade_type,
                    request.transaction_id,
                    request.time_end,
                    __CONFIG__.__ENUM_ORDER_STATUS__.SUCCESS,
                    '支付成功',
                    request.out_trade_no
                ]
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
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
 * 提交退款申请
 * @param request
 * @returns {*|promise}
 */
function submitNewRefund(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicInsertSQL: __STATEMENT__.__ADD_NEW_REFUND__,
            basicInsertParams: {
                out_refund_no: request.out_refund_no,
                out_trade_no: request.out_trade_no,
                transactionID: request.transactionID,
                refundFee: request.refundFee,
                status: request.status,
                stock_no: request.stock_no,
                reason: request.reason,
                remark: request.remark
            }
        })
        .then(__MYSQL_API__.beginTransaction)
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
 *   申请退款成功后修改状态信息
 * @param request
 * @returns {*|promise}
 */
function changeRefundStatus(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicUpdateSQL: __STATEMENT__.__CHANGE_REFUND_STATUS__,
            basicUpdateParams: [
                request.completeTime,
                request.status,
                request.remark,
                request.out_refund_no
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
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
 *   获取商品列表
 *
 * @param request
 * @returns {*|promise}
 */
function fetchProductList(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicQuerySQL: __STATEMENT__.__FETCH_PRODUCT_LIST__,
            basicQueryParams: []
        })
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
 *   获取商品详情
 *
 * @param request
 * @returns {*|promise}
 */
function fetchProductDetail(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'standards',
                'skuList'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_PRODUCT_STANDARDS__,
                __STATEMENT__.__FETCH_SKU_LIST__
            ],
            batchQueryParams: [                             //  对应参数
                [request.id],
                [request.id]
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

function fetchOrderDetail(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicQuerySQL: __STATEMENT__.__FETCH_ORDER_DETAIL__,
            basicQueryParams: [
                request.out_trade_no
            ]
        })
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

module.exports = {
    fetchUserOpenId: fetchUserOpenId,
    fetchProductList: fetchProductList,
    fetchProductDetail: fetchProductDetail,
    addStockAttribute: addStockAttribute,
    submitNewOrder: submitNewOrder,
    updateOrderAfterPay: updateOrderAfterPay,
    fetchOrderDetail: fetchOrderDetail
};

// fetchProductDetail({
//     product_id: 'lJfQQu4AQGmxNCwfwrpzBnvxk9nRus2z'
// });

// fetchProductList({}, function (result) {
//     __LOGGER__.debug(result);
// });

// changeRefundStatus({
//     completeTime: '2018-05-16 11:31:23',
//     status: 2,
//     remark: '退款成功',
//     out_refund_no: '13297414012018051611195367345818'
// }, function (result) {
//     __LOGGER__.debug(result);
// });

//UpdateOrderAfterPay({
//    bankType: 'CMBC_CREDIT',
//    mchID: '1329741401',
//    tradeType: 'JSAPI',
//    transactionID: '4009922001201709121702151317',
//    payTime: null,
//    status: __CONFIG__.__ENUM_ORDER_STATUS__.SUCCESS,
//    out_trade_no: 'zONc9tfoLodZ4zLKnp2cY4uotDFJXVdr'
//});

// const __WECHAT_PAY_HELPER__ = require('../services/wechat.pay/wechat.pay.helper');
// submitNewRefund({
//     out_refund_no: __WECHAT_PAY_HELPER__.generateRandomNO(),
//     out_trade_no: 'zONc9tfoLodZ4zLKnp2cY4uotDFJXVdr',
//     transactionID: '4009922001201709121702151317',
//     refundFee: 1,
//     status: 1,
//     stock_no: 'gUKvRPUIP8R5LmmFm67csknO35fz2Mhl',
//     reason: '申请退款',
//     remark: 'TEST'
// }, function (result) {
//     __LOGGER__.debug(result);
// });

// closeOrder({
//     out_trade_no: 'zONc9tfoLodZ4zLKnp2cY4uotDFJXVdr'
// }, function (result) {
//     __LOGGER__.debug(result);
// });

// submitNewOrder({        //  传入参数
//     session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//     order: {
//         consignee_no: 'QRtI6giH5AR72lkrAMrW9J4rjyFKZLtc',
//         totalFee: 12,
//         attach: '测试订单',
//         prepayID: 'QRtI6giH5A122lkrAMrW9J4rjyFKZLtc',
//         skuList: [
//             {stock_no: 'gUKvRPUIP8R5LmmFm67csknO35fz2Mhl', amount: 0},
//             {stock_no: 'JZtt2fIe5UcVTo3exOqddkuZDbMgQjks', amount: 2},
//             {stock_no: 'NoD1fgBx5ncrtWnO9wIGLf5AsxRSjfVz', amount: 3},
//             {stock_no: 'RVwHEVMTUBOt2xRpu8l8wNHMo9g8uhi5', amount: 4},
//             {stock_no: 'vtTzYJot4LO30kM7YO8FDdzR1pyYHosY', amount: 5}
//         ]
//     }
// }, function (result) {
//     __LOGGER__.info(result);
// });

//joinToCart({
//    session: 'HJwC99VlJhgjN4yzLL3MuqhWIFlBlDwh',
//    cart: [
//        {stock_no: 'gUKvRPUIP8R5LmmFm67csknO35fz2Mhl', amount: 10},
//        {stock_no: 'JZtt2fIe5UcVTo3exOqddkuZDbMgQjks', amount: 1000},
//        {stock_no: 'NoD1fgBx5ncrtWnO9wIGLf5AsxRSjfVz', amount: 100000},
//        { stock_no: 'RVwHEVMTUBOt2xRpu8l8wNHMo9g8uhi5', amount: 90},
//        { stock_no: 'wnbIf9JrMH7q2bSVZLzxyP6l6NlsBbSe', amount: 10}
//    ]
//}, function (result) {
//    __LOGGER__.info(result);
//});

// createNewProduct({
//         session: 'vRv7IR9Yvfn0673YPnz8dVVS9icfe66A',
//         name: 'Test',
//         description: 'Test',
//         attributes: [
//             {key: 3, values: [6, 7]},
//             {key: 1, values: [2, 4, 5]}
//         ],
//         skuList: [
//             {unit: 1, stock: 10, attributes: '1,3'},
//             {unit: 2, stock: 10, attributes: '1,4'},
//             {unit: 3, stock: 10, attributes: '1,5'},
//             {unit: 4, stock: 10, attributes: '2,3'},
//             {unit: 5, stock: 10, attributes: '2,4'},
//             {unit: 6, stock: 10, attributes: '2,5'}
//         ]
//     },
//     function (result) {
//         __LOGGER__.info(result);
//     }
// )

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
//             value: 'Blue',
//             aid: '3'
//         },
//         {
//             value: 'Yellow',
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
