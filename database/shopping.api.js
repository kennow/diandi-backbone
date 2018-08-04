const Q = require('q');
const __UTIL__ = require('util');
const __MOMENT__ = require('moment');
const __HELPER__ = require('../utility/helper');
const __MYSQL_API__ = require('./mysql.base');
const __CONFIG__ = require('./shopping.config');
const __USER_STATEMENT__ = require('./user.sql.statement');
const __STATEMENT__ = require('./shopping.sql.statement');
// const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.api.js');

/**
 *  检测登录态
 * @param request
 * @returns {*|promise|C}
 */
function checkSession(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.cleanup)
        .then(function () {
            deferred.resolve(request);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *      新增SKU属性名称
 *
 * @param request
 */
function addNewStockAttribute(request) {
    const deferred = Q.defer();

    let tmp = JSON.parse(request.attributes);
    let attributes = tmp.map(item => {
        'use strict';
        let values = item.values.map(value => {
            return {
                vid: 0,
                value: value
            };
        });
        return {
            aid: 0,
            name: item.name,
            values: values
        };
    });
    console.dir(attributes);

    let params = {
        attributes: attributes,
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *
         */
        xStepIndex: 0,
        xStepCount: 0,
        xStepSQLs: [],
        xStepParams: [],
        mopUpFn: function (res) {
            let aid = 0;
            //  如果返回数组，则为查询结果
            if (res.result instanceof Array) {
                aid = res.result[0].aid;
            } else {
                //  否则为新增记录的返回结果
                aid = res.result.insertId;
            }
            res.params.attributes = res.params.attributes.map(attribute => {
                //  保存记录的aid
                if (attribute.name === res.params.xStepParams[res.params.xStepIndex - 3][0]) {
                    attribute.aid = aid;
                }
                return attribute;
            });
            return Q(res);
        }
    };

    params.xStepCount = attributes.length;
    for (let i = 0; i < params.xStepCount; i++) {
        // SQL语句
        params.xStepSQLs.push(__STATEMENT__.__CHECK_SKU_ATTRIBUTE__);
        params.xStepSQLs.push(__STATEMENT__.__ADD_NEW_SKU_ATTRIBUTE__);
        params.xStepSQLs.push(__STATEMENT__.__FETCH_SKU_ATTRIBUTE__);
        // SQL语句的执行参数
        params.xStepParams.push([attributes[i].name]);
        params.xStepParams.push({
            name: attributes[i].name
        });
        params.xStepParams.push([attributes[i].name]);
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.executeStepXWithMopUp)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function () {
            console.log(params.attributes);
            deferred.resolve(params.attributes);
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
function addNewStockValue(request) {
    const deferred = Q.defer();

    let params = {
        attributes: request,
        xStepIndex: 0,
        xStepCount: 0,
        xStepSQLs: [],
        xStepParams: [],
        mopUpFn: function (res) {
            let vid = 0;
            //  如果返回数组，则为查询结果
            if (res.result instanceof Array) {
                vid = res.result[0].vid;
            } else {
                //  否则为新增记录的返回结果
                vid = res.result.insertId;
            }
            res.params.attributes = res.params.attributes.map(attribute => {
                //  保存记录的vid
                attribute.values = attribute.values.map(item => {
                    if (attribute.aid === res.params.xStepParams[res.params.xStepIndex - 3][1] &&
                        item.value === res.params.xStepParams[res.params.xStepIndex - 3][0]) {
                        item.vid = vid;
                    }
                    return item;
                });
                return attribute;
            });
            return Q(res);
        }
    };

    for (let i = 0; i < request.length; i++) {
        for (let j = 0; j < request[i].values.length; j++) {
            params.xStepCount++;
            // SQL语句
            params.xStepSQLs.push(__STATEMENT__.__CHECK_SKU_VALUE__);
            params.xStepSQLs.push(__STATEMENT__.__ADD_NEW_SKU_VALUE__);
            params.xStepSQLs.push(__STATEMENT__.__FETCH_SKU_VALUE__);
            // SQL语句的执行参数
            params.xStepParams.push([request[i].values[j].value, request[i].aid]);
            params.xStepParams.push({
                value: request[i].values[j].value,
                aid: request[i].aid
            });
            params.xStepParams.push([request[i].values[j].value, request[i].aid]);
        }
    }

    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.executeStepXWithMopUp)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            deferred.resolve(params.attributes);
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 *  添加新图片
 * @param request
 * @returns {*|promise|C}
 */
function addNewImage(request) {
    const deferred = Q.defer();

    const imageId = __HELPER__.getNonceStr(32);
    __MYSQL_API__
        .setUpConnection({
            /**
             *  插入图片
             */
            basicInsertSQL: __STATEMENT__.__ADD_NEW_IMAGE__,
            basicInsertParams: {
                'imageid': imageId,
                'name': request.name,
                'type': request.type,
                'size': request.size,
                'url': request.url
            }
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.basicInsert)
        .then(__MYSQL_API__.commitTransaction)
        .then(__MYSQL_API__.cleanup)
        .then(function () {
            deferred.resolve({
                imageId: imageId
            });
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

// addNewImage({
//     name: 'ps2018061516095182273193.jpg',
//     type: 'image/jpeg',
//     size: 74011,
//     url: 'https://media.thinmelon.cc/ps2018061516095182273193.jpg'
// }).then();

// { session: 'kGKs01p7ONomrPWeGKdopUv1HbXcdQlZ',
//     product: '{"name":"测试","introduce":"测试","attributes":[{"aid":1,"name":"大小","values":[{"vid":2,"value":"S"},{"vid":4,"value":"M"}]},{"aid":3,"name":"颜色","values":[{"vid":17,"value":"红色"}]}],"sku":[{"unit":0,"amount":0,"vids":"2,17,","大小":"S","颜色":"红色"},{"unit":0,"amount":0,"vids":"4,17,","大小":"M","颜色":"红色"}],"thumbnails":[{"imageId":"xfUDj7y9JWZVwIeubGEht1vdXfljKMlc","type":0}],"details":[{"imageId":"xfUDj7y9JWZVwIeubGEht1vdXfljKMlc","type":1}]}' }
/**
 *      新增商品
 *
 *  同时更新SKU表、 Product表及 rel_product_attribute_value表
 *
 * @param request
 */
function addNewProduct(request) {
    const deferred = Q.defer();
    const productId = __HELPER__.getNonceStr(32);
    const product = JSON.parse(request.product);
    let params = {
        /**
         *  1. 检测登录态
         */
        checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
        checkSessionParams: [
            request.session
        ],
        /**
         *  2. 新增商品
         */
        basicInsertSQL: __STATEMENT__.__ADD_NEW_PRODUCT__,
        basicInsertParams: [{
            pid: productId,
            name: product.name,
            description: product.introduce,
            type: product.type
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
    for (let i = 0; i < product.attributes.length; i++) {
        for (let j = 0; j < product.attributes[i].values.length; j++) {
            params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_PRODUCT_ATTR_VALUE__);
            params.oneStepParams.push({
                pid: productId,
                aid: product.attributes[i].aid,
                vid: product.attributes[i].values[j].vid
            });
        }
    }

    /**
     *  表 tb_sku
     */
    for (let k = 0; k < product.sku.length; k++) {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_NEW_SKU__);
        params.oneStepParams.push({
            stock_no: __HELPER__.getNonceStr(32),
            unit: product.sku[k].unit,
            stock: product.sku[k].amount,
            attributes: product.sku[k].vids,
            product_id: productId
        });
    }

    /**
     *  表 rel_product_gallery
     */

    constructProductGallerySQL(params, productId, product.thumbnails);
    constructProductGallerySQL(params, productId, product.details);
    constructProductGallerySQL(params, productId, product.videos);

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

function constructProductGallerySQL(params, productId, gallery) {
    for (let p = 0; p < gallery.length; p++) {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_PRODUCT_GALLERY__);
        params.oneStepParams.push({
            productid: productId,
            imageid: gallery[p].imageId,
            type: gallery[p].type,
            number: gallery[p].number
        });
    }
}

/**
 *   移除商品
 *      --  后台
 *      --  主表： tb_product
 *          关联： tb_sku, rel_product_attribute_value, rel_product_gallery
 * @param request
 * @returns {*|C|promise}
 */
function removeProduct(request) {
    const deferred = Q.defer();
    let params = {
        /**
         *  1. 批量查询商品
         */
        batchQueryIndex: 0,                             //  索引
        batchQueryTag: [                                //  标签
            'sku',
            'attribute',
            'gallery',
            'product'
        ],
        batchQuerySQL: [                                //  执行语句
            __STATEMENT__.__REMOVE_PRODUCT_SKU__,
            __STATEMENT__.__REMOVE_PRODUCT_ATTRIBUTE__,
            __STATEMENT__.__REMOVE_PRODUCT_GALLERY__,
            __STATEMENT__.__REMOVE_PRODUCT__
        ],
        batchQueryParams: [                             //  对应参数
            [request.productid],
            [request.productid],
            [request.productid],
            [request.productid]
        ]
    };
    __MYSQL_API__
        .setUpConnection(params)
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.inAll)
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
 * 改变商品的状态
 *      --  上/下架
 * @param request
 * @returns {*|C|promise}
 */
function changeProductStatus(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicUpdateSQL: __STATEMENT__.__UPDATE_PRODUCT_STATUS__,
            basicUpdateParams: [
                request.status, request.productid
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

// removeProduct({
//     productid: 'SZvjvLOcbuAmH8lsS7S8WpJDO6d49r5N'
// }).then(res => {
//     console.log(res);
// });

/**
 * 提交订单
 * @param request
 * @returns {*|promise}
 */
function submitNewOrder(request) {
    const deferred = Q.defer();
    let params = {
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

    for (let i = 0; i < request.order.skuList.length; i++) {
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
 *  重新支付
 *      -   获取订单的prepay_id
 * @param request
 */
function repay(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 找到对应的 order
             */
            singleLineQuerySQL: __STATEMENT__.__FETCH_PREPAY_ID__,
            singleLineQueryParams: [
                request.out_trade_no
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.singleLineQuery)
        .then(__MYSQL_API__.cleanup)
        .then(function (result) {
            console.log(result);
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
            basicUpdateParams: [
                __CONFIG__.__ENUM_ORDER_STATUS__.CLOSE,
                __MOMENT__().format('YYYY-MM-DD HH:mm:ss') + '关闭订单',
                request.out_trade_no]
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
 * 检查发起退款的权限
 * @param request
 * @returns {*|promise|C}
 */
function checkRefundPermission(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 检测用户权限
             */
            checkPermissionSQL: __USER_STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'ORDER',
                'REFUND',
                request.session
            ],
            /**
             *  3. 检测退款订单状态，不能重复提交退款请求
             */
            checkRefundStatusSQL: __STATEMENT__.__CHECK_REFUND_STATUS__,
            checkRefundStatusParams: [
                request.out_refund_no
            ]
        })
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.checkPermission)
        .then(__MYSQL_API__.checkRefundStatus)
        .then(__MYSQL_API__.cleanup)
        .then(function () {
            deferred.resolve(request);
        })
        .catch(function (request) {
            __MYSQL_API__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

/**
 * 检查用户发起的退款申请，无误后调用微信退款接口，并更新退款进度
 * 字段：
 *      refund_id
 *      status
 *      startTime
 *      remark
 * KEY:
 *      out_refund_no
 * @param request
 * @returns {*|promise}
 */
function submitNewRefund(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicUpdateSQL: __STATEMENT__.__SUBMIT_NEW_REFUND__,
            basicUpdateParams: [
                request.refund_id,
                __CONFIG__.__ENUM_REFUND_STATUS__.REFUNDING,
                __MOMENT__().format('YYYYMMDDHHmmss'),
                __MOMENT__().format('YYYY-MM-DD HH:mm:ss') + ' JSAPI 发起退款申请',
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
 *   申请退款成功后修改状态信息
 *
 * @param request
 * @returns {*|promise}
 */
function changeRefundStatus(request) {
    const deferred = Q.defer();

    //  退款进度
    let status;
    switch (request.refund_status) {
        case 'SUCCESS':
            status = __CONFIG__.__ENUM_REFUND_STATUS__.SUCCESS;
            break;
        case 'CHANGE':
            status = __CONFIG__.__ENUM_REFUND_STATUS__.CHANGE;
            break;
        case 'REFUNDCLOSE':
            status = __CONFIG__.__ENUM_REFUND_STATUS__.CLOSED;
            break;
        default:
            break;
    }
    // 进度说明
    const remark = __MOMENT__().format('YYYY-MM-DD HH:mm:ss') +
        ' refund_status: ' + request.refund_status + ' 退款入账方：' + request.refund_recv_accout;


    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 更新退款进度
             *  2. 更新订单状态
             */
            oneStepIndex: 0,
            oneStepSQLs: [
                __STATEMENT__.__CHANGE_REFUND_STATUS__,
                __STATEMENT__.__CHANGE_ORDER_STATUS__
            ],
            oneStepParams: [
                [
                    __MOMENT__().format('YYYYMMDDHHmmss'),
                    status,
                    remark,
                    request.out_refund_no
                ],
                [
                    __CONFIG__.__ENUM_ORDER_STATUS__.REFUND,
                    remark,
                    request.out_trade_no
                ]
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
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
 *   获取商品列表
 *
 * @param request
 * @returns {*|promise}
 */
function fetchProductList(request) {
    const deferred = Q.defer();

    let statement;
    if (request.hasOwnProperty('queryType')) {
        statement = __STATEMENT__.__FETCH_PRODUCT_FULL__;
    } else {
        statement = __STATEMENT__.__FETCH_PRODUCT_PART__;
    }

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 批量查询商品
             */
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'product',
                'gallery'
            ],
            batchQuerySQL: [                                //  执行语句
                statement,
                __STATEMENT__.__FETCH_PRODUCT_THUMBNAILS__
            ],
            batchQueryParams: [                             //  对应参数
                [request.startTime, parseInt(request.number)],
                [request.startTime, parseInt(request.number)]
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
 *
 * @param request
 * @returns {*|C|promise}
 */
function fetchPartialProductList(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 查询商品
             */
            basicQuerySQL: __STATEMENT__.__FETCH_PARTIAL_PRODUCT__,
            basicQueryParams: [
                parseInt(request.offset),
                parseInt(request.amount)
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
                'product',
                'standards',
                'skuList',
                'gallery'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_PRODUCT_DETAILS__,
                __STATEMENT__.__FETCH_PRODUCT_STANDARDS__,
                __STATEMENT__.__FETCH_SKU_LIST__,
                __STATEMENT__.__FETCH_PRODUCT_GALLERY__
            ],
            batchQueryParams: [                             //  对应参数
                [request.id],
                [request.id],
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

/**
 *    获取订单列表
 *
 * @param request
 */
function fetchOrderList(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 检测用户权限
             */
            checkPermissionSQL: __USER_STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'ORDER',
                'QUERY_ALL',
                request.session
            ],
            /**
             *  3. 查询订单列表
             */
            basicQuerySQL: __STATEMENT__.__FETCH_ORDER_LIST__,
            basicQueryParams: [
                request.session,
                request.startTime,
                parseInt(request.number)
            ]
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
 *  查询某个订单
 *      --  后台
 * @param request
 * @returns {*|C|promise}
 */
function fetchAOrder(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 检测用户权限
             */
            checkPermissionSQL: __USER_STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'ORDER',
                'QUERY_ALL',
                request.session
            ],
            /**
             *  3. 批量查询订单
             */
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'order',
                'sku'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_A_ORDER__,
                __STATEMENT__.__FETCH_A_ORDER_SKU__
            ],
            batchQueryParams: [                             //  对应参数
                [request.out_trade_no],
                [request.out_trade_no]
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
 *   获取订单详情
 * @param request
 * @returns {*|promise}
 */
function fetchOrderDetail(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'detail',
                'product'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_ORDER_DETAIL__,
                __STATEMENT__.__FETCH_ORDER_PRODUCT__
            ],
            batchQueryParams: [                             //  对应参数
                [request.out_trade_no],
                [request.out_trade_no]
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
 * 确认用户是否已购买商品
 * @param request
 * @returns {*|C|promise}
 */
function checkEverBought(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'order',
                'card'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__EVER_BOUGHT__,
                __STATEMENT__.__EVER_GET_CARD__
            ],
            batchQueryParams: [                             //  对应参数
                [request.session, request.stock_no],
                [request.session, request.stock_no]
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
 *   获取超时未支付的订单
 * @param request
 * @returns {*|C|promise}
 */
function fetchOrderNotPayTimeout(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            basicQuerySQL: __STATEMENT__.__FETCH_ORDER_NOT_PAY_TIMEOUT__,
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
 *    获取退款单详情
 * @param request
 * @returns {*}
 */
function fetchRefundInfo(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 检测用户权限
             */
            checkPermissionSQL: __USER_STATEMENT__.__CHECK_PERMISSION__,
            checkPermissionParams: [
                'ORDER',
                'QUERY_ALL',
                request.session
            ],
            /**
             *  3. 查询退款进度
             */
            basicQuerySQL: __STATEMENT__.__FETCH_REFUND_INFO__,
            basicQueryParams: [
                request.out_trade_no
            ]
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
 * 查询商品关联的卡券ID
 * @param request
 * @returns {*|C|promise}
 */
function queryProductCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.query.session
            ],
            /**
             *  2. 查询商品对应的卡券ID
             */
            basicQuerySQL: __STATEMENT__.__QUERY_PRODUCT_CARD__,
            basicQueryParams: [
                request.params.id
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
 * 在商品与卡券间建立关联
 * @param request
 * @returns {*|C|promise}
 */
function associateProductCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 判断该商品是否已经关联卡券
             */
            isRepeatSQL: __STATEMENT__.__CHECK_ASSOCIATE__,
            isRepeatParams: [
                request.product_id
            ],
            /**
             *  3. 不存在，则新增一条联接
             *     存在，更新卡券ID
             */
            basicInsertSQL: __STATEMENT__.__ADD_PRODUCT_CARD__,
            basicInsertParams: {
                productId: request.product_id,
                cardId: request.card_id
            },
            basicUpdateSQL: __STATEMENT__.__UPDATE_PRODUCT_CARD__,
            basicUpdateParams: [
                request.card_id,
                request.product_id
            ]
        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.isRepeat)
        .then(
            __MYSQL_API__.basicInsert,
            __MYSQL_API__.basicUpdate
        )
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

function checkProductCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测是否与支付订单时所使用的账户一致
             */
            checkOpenIDConsistencySQL: __STATEMENT__.__CHECK_OPENID_CONSISTENCY__,
            checkOpenIDConsistencyParams: [
                request.openid,
                request.session
            ],
            /**
             *  2. 查询商品对应的卡券ID
             */
            basicQuerySQL: __STATEMENT__.__QUERY_PRODUCT_CARD__,
            basicQueryParams: [
                request.product_id
            ]
        })
        .then(__MYSQL_API__.checkOpenIDConsistency)
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
 * 在用户领取卡券后记录
 * @param request
 * @returns {*}
 */
function recordUserCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 判断记录是否已存在
             */
            isRepeatSQL: __STATEMENT__.__CHECK_USER_CARD_RECORD__,
            isRepeatParams: [
                request.cardid,
                request.code
            ],
            /**
             *  3. 不存在，新增一条记录
             */
            basicInsertSQL: __STATEMENT__.__ADD_USER_CARD_RECORD__,
            basicInsertParams: {
                cardid: request.cardid,
                code: request.code,
                openid: request.openid,
                createTime: request.timestamp,
                out_trade_no: request.out_trade_no
            },
            /**
             *  4. 存在，更新记录
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_USER_CARD_RECORD__,
            basicUpdateParams: [
                request.out_trade_no,
                request.openid,
                request.cardid,
                request.code
            ]

        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.checkSession)
        .then(__MYSQL_API__.isRepeat)
        .then(
            __MYSQL_API__.basicInsert,
            __MYSQL_API__.basicUpdate
        )
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
 * 根据用户的订单号，查询相应的卡券列表
 * @param request
 * @returns {*|C|promise}
 */
function queryUserCards(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 查询用户的卡券列表
             */
            basicQuerySQL: __UTIL__.format(__STATEMENT__.__QUERY_USER_CARDS__, request.tradeList),
            basicQueryParams: []
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
 * 领取卡券
 * @param request
 * @returns {*}
 */
function userGetCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 判断记录是否已存在
             */
            isRepeatSQL: __STATEMENT__.__CHECK_USER_CARD_RECORD__,
            isRepeatParams: [
                request.cardid,
                request.usercardcode
            ],
            /**
             *  3. 不存在，新增一条记录
             */
            basicInsertSQL: __STATEMENT__.__ADD_USER_CARD_RECORD__,
            basicInsertParams: {
                cardid: request.cardid,
                code: request.usercardcode,
                createTime: __MOMENT__(request.createtime, 'X').format('YYYY-MM-DD HH:mm:ss'),
                toUserName: request.tousername,
                fromUserName: request.fromusername,
                unionid: request.unionid,
                isGiveByFriend: request.isgivebyfriend,
                friendUserName: request.friendusername,
                oldUserCardCode: request.oldusercardcode,
                outerid: request.outerid
            },
            /**
             *  4. 存在，更新记录
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_USER_CARD_RECORD_FROM_BACKBONE__,
            basicUpdateParams: [
                __MOMENT__(request.createtime, 'X').format('YYYY-MM-DD HH:mm:ss'),
                request.tousername,
                request.fromusername,
                request.unionid,
                request.isgivebyfriend,
                request.friendusername,
                request.oldusercardcode,
                request.outerid,
                request.cardid,
                request.usercardcode
            ]

        })
        .then(__MYSQL_API__.beginTransaction)
        .then(__MYSQL_API__.isRepeat)
        .then(
            __MYSQL_API__.basicInsert,
            __MYSQL_API__.basicUpdate
        )
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
 * 快速买单
 */
function userPayFromPayCell(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  更新记录
             */
            basicUpdateSQL: __STATEMENT__.__USER_PAY_FROM_PAY_CELL__,
            basicUpdateParams: [
                __MOMENT__(request.createtime, 'X').format('YYYY-MM-DD HH:mm:ss'),
                request.transid,
                request.locationid,
                request.fee,
                request.originalfee,
                request.cardid,
                request.usercardcode
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
 * 卡券核销
 */
function userConsumeCard(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  更新记录
             */
            basicUpdateSQL: __STATEMENT__.__USER_CONSUME_CARD__,
            basicUpdateParams: [
                __MOMENT__(request.createtime, 'X').format('YYYY-MM-DD HH:mm:ss'),
                request.consumesource,
                request.staffopenid,
                request.transid,
                request.cardid,
                request.usercardcode
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
 * 获取商户列表
 * @param request
 * @returns {*|C|promise}
 */
function fetchBusinessList(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检查登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 查询商户列表
             */
            basicQuerySQL: __STATEMENT__.__FETCH_BUSINESS_LIST__,
            basicQueryParams: []
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
 * 查询商户
 * @param request
 * @returns {*}
 */
function fetchBusinessDetail(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检查登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 查询商户信息
             */
            batchQueryIndex: 0,                             //  索引
            batchQueryTag: [                                //  标签
                'business',
                'product',
                'material'
            ],
            batchQuerySQL: [                                //  执行语句
                __STATEMENT__.__FETCH_BUSINESS__,
                __STATEMENT__.__FETCH_REL_BUSINESS_PRODUCT__,
                __STATEMENT__.__FETCH_REL_BUSINESS_MATERIAL__
            ],
            batchQueryParams: [                             //  对应参数
                [request.bid],
                [request.bid],
                [request.bid]
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
 * 添加商户
 *
 * @param request
 * @returns {*}
 */
function addBusiness(request) {
    const deferred = Q.defer();
    const businessId = __HELPER__.getNonceStr(32);
    const business = JSON.parse(request.business);

    let
        params = {
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 新增商户及相关联系
             */
            oneStepIndex: 0,
            oneStepSQLs: [],
            oneStepParams: []
        };

    /**
     *  表 tb_business
     */
    params.oneStepSQLs.push(__STATEMENT__.__ADD_BUSINESS__);
    params.oneStepParams.push({
        bid: businessId,
        name: business.name,
        latitude: business.latitude,
        longitude: business.longitude,
        type: business.type,
        shopHours: business.shopHours,
        phone: business.phone,
        address: business.address,
        consumptionPerPerson: business.consumptionPerPerson,
        remark: business.remark
    });

    /**
     *  表 rel_business_product
     */
    if (business.associatedProductPid && business.associatedProductPid !== '') {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_BUSINESS_PRODUCT__);
        params.oneStepParams.push({
            businessId: businessId,
            productId: business.associatedProductPid
        });
    }

    /**
     *  表 rel_business_material
     */
    if (business.associatedMaterialId && business.associatedMaterialId !== '') {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_BUSINESS_MATERIAL__);
        params.oneStepParams.push({
            businessId: businessId,
            mediaId: business.associatedMaterialId
        });
    }

    __MYSQL_API__
        .setUpConnection(params)
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
 * 编辑商户
 * @param request
 * @returns {*}
 */
function updateBusiness(request) {
    const deferred = Q.defer();
    const business = JSON.parse(request.business);

    let
        params = {
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 新增商户及相关联系
             */
            oneStepIndex: 0,
            oneStepSQLs: [],
            oneStepParams: []
        };

    /**
     *  表 tb_business
     */
    params.oneStepSQLs.push(__STATEMENT__.__UPDATE_BUSINESS__);
    params.oneStepParams.push([{
        name: business.name,
        latitude: business.latitude,
        longitude: business.longitude,
        type: business.type,
        shopHours: business.shopHours,
        phone: business.phone,
        address: business.address,
        consumptionPerPerson: business.consumptionPerPerson,
        remark: business.remark
    },
        business.bid
    ]);

    /**
     *  表 rel_business_product
     */
    params.oneStepSQLs.push(__STATEMENT__.__REMOVE_REL_BUSINESS_PRODUCT__);
    params.oneStepParams.push([business.bid]);
    if (business.associatedProductPid && business.associatedProductPid !== '') {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_BUSINESS_PRODUCT__);
        params.oneStepParams.push({
            businessId: business.bid,
            productId: business.associatedProductPid
        });
    }

    /**
     *  表 rel_business_material
     */
    params.oneStepSQLs.push(__STATEMENT__.__REMOVE_REL_BUSINESS_MATERIAL__);
    params.oneStepParams.push([business.bid]);
    if (business.associatedMaterialId && business.associatedMaterialId !== '') {
        params.oneStepSQLs.push(__STATEMENT__.__ADD_REL_BUSINESS_MATERIAL__);
        params.oneStepParams.push({
            businessId: business.bid,
            mediaId: business.associatedMaterialId
        });
    }

    __MYSQL_API__
        .setUpConnection(params)
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
 * 移除商户
 * @param request
 * @returns {*}
 */
function deleteBusiness(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 新增商户及相关联系
             */
            oneStepIndex: 0,
            oneStepSQLs: [
                __STATEMENT__.__REMOVE_REL_BUSINESS_PRODUCT__,
                __STATEMENT__.__REMOVE_REL_BUSINESS_MATERIAL__,
                __STATEMENT__.__REMOVE_BUSINESS__
            ],
            oneStepParams: [
                [request.bid],
                [request.bid],
                [request.bid]
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
 * 修改商户状态
 * @param request
 * @returns {*}
 */
function changeBusinessStatus(request) {
    const deferred = Q.defer();

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 检测登录态
             */
            checkSessionSQL: __USER_STATEMENT__.__CHECK_SESSION__,
            checkSessionParams: [
                request.session
            ],
            /**
             *  2. 修改状态
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_BUSINESS_STATUS__,
            basicUpdateParams: [
                request.status, request.bid
            ]
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

module.exports = {
    checkSession: checkSession,
    fetchProductList: fetchProductList,
    fetchPartialProductList: fetchPartialProductList,
    fetchProductDetail: fetchProductDetail,
    addNewStockAttribute: addNewStockAttribute,
    addNewStockValue: addNewStockValue,
    addNewImage: addNewImage,
    addNewProduct: addNewProduct,
    removeProduct: removeProduct,
    changeProductStatus: changeProductStatus,
    submitNewOrder: submitNewOrder,
    updateOrderAfterPay: updateOrderAfterPay,
    repay: repay,
    closeOrder: closeOrder,
    fetchOrderList: fetchOrderList,
    fetchAOrder: fetchAOrder,
    fetchOrderDetail: fetchOrderDetail,
    fetchOrderNotPayTimeout: fetchOrderNotPayTimeout,
    checkEverBought: checkEverBought,
    checkRefundPermission: checkRefundPermission,
    submitNewRefund: submitNewRefund,
    changeRefundStatus: changeRefundStatus,
    fetchRefundInfo: fetchRefundInfo,
    queryProductCard: queryProductCard,
    associateProductCard: associateProductCard,
    checkProductCard: checkProductCard,
    recordUserCard: recordUserCard,
    queryUserCards: queryUserCards,
    userGetCard: userGetCard,
    userPayFromPayCell: userPayFromPayCell,
    userConsumeCard: userConsumeCard,
    fetchBusinessList: fetchBusinessList,
    fetchBusinessDetail: fetchBusinessDetail,
    addBusiness: addBusiness,
    updateBusiness: updateBusiness,
    deleteBusiness: deleteBusiness,
    changeBusinessStatus: changeBusinessStatus
};

//changeRefundStatus({
//    out_refund_no: '13297414012018052214115944426193',
//    out_trade_no: '13297414012018052214015068882433',
//    refund_account: 'REFUND_SOURCE_RECHARGE_FUNDS',
//    refund_fee: '1',
//    refund_id: '50000106962018052204722170525',
//    refund_recv_accout: '支付用户零钱',
//    refund_request_source: 'API',
//    refund_status: 'SUCCESS',
//    settlement_refund_fee: '1',
//    settlement_total_fee: '1',
//    success_time: '2018-05-22 13:53:10',
//    total_fee: '1',
//    transaction_id: '4200000129201805220802079601'
//});
// fetchProductDetail({
//     id: 'W7kmHOCNkVHCeDzy3lS2RJZSUnXgHSQL'
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

//addBusiness(
//    {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        business: '{"type":"32","name":"瓜博士","address":"莆田市城厢区学园中街吉祥如意楼瓜博士（安福妈祖文化研究院旁）","longitude":119.017532,"latitude":25.4478,"shopHours":"11:00-14:00 ；17:00-03:00","phone":"0594-2568777","comsuptionPerPersion":"￥60+","remark":"福利一：吃货队粉丝享受全场菜金5折>的特权；（酒水锅底饮料除外，仅限堂食）\\n\\n福利二：享受吃多少送多少的特权（送的充值金额可在下次消费时无门槛抵用）\\n\\n活动时间：8月4号 -8月11号，福利一福利二不可同享","associatedProductPid":"ZQ1IkvOcxbKP8ZqxsfBByfA6DlT8djJy","associatedMaterialId":"n584HX_l4p6cYQBacvvsyynyglNzjRVWMs9vOmDVt6U"}'
//    }
//);

//deleteBusiness({
//    session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//    bid: 'Kklf1QVo4jEmF0J8PKsk9zSuLWbDiAYX'
//});
