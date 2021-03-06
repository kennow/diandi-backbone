const Q = require('q');
const __UTIL__ = require('util');
const __MOMENT__ = require('moment');
const __WX_PAY_HELPER__ = require('../services/wechat.pay/wechat.pay.helper');
const __WX_PAY_SERVICE__ = require('../services/wechat.pay/wechat.pay.service');
const __USER_DATABASE__ = require('../database/user.api');
const __SHOPPING_DATABASE__ = require('../database/shopping.api');
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.controller.js');
const __SERVICE_WECHAT_ACCESS_TOKEN__ = require('../services/wechat.access_token/wechat.access_token.service');
const __SERVICE_WECHAT_SHOPPING_CARD__ = require('../services/wechat.shopping.card/wechat.shopping.card.service');
const __STRUCTURE__ = require('../services/wechat.shopping.card/wechat.shopping.card.structure');

/**
 *      获取商品列表
 *
 * @param request
 * @param response
 */
function fetchProductList(request, response) {
    __SHOPPING_DATABASE__
        .fetchProductList(request.query)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// fetchProductList({
//     query: {
//         session: 'bn8JL4gFvduiIfNC1fwAPGGEPXnZvltS',
//         startTime: '2018-06-28',
//         number: 10,
//         queryType: 'FULL'
//     }
// }, (res) => {
//     'use strict';
//     console.log(res.msg.product);
//     console.log(res.msg.gallery);
// });

/**
 *      获取部分商品列表
 *
 * @param request
 * @param response
 */
function fetchPartialProductList(request, response) {
    __SHOPPING_DATABASE__
        .fetchPartialProductList(request.query)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

//fetchPartialProductList({
//    query: {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        offset: 5,
//        amount: 5
//    }
//}, result => {
//    'use strict';
//    //console.log(result);
//    result.msg.map(item => {
//        console.log(decodeURIComponent(item.name));
//    })
//});

/**
 *   获取商品详情
 *
 * @param request
 * @param response
 */
function fetchProductDetail(request, response) {
    __SHOPPING_DATABASE__
        .fetchProductDetail(request.params)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 * 提交统一订单
 * @param request
 * @param response
 */
function submitUnifiedOrder(request, response) {
    const out_trade_no = __WX_PAY_HELPER__.generateRandomNO();
    const consignee_no = request.body.consignee_no;
    const body = request.body.body;
    const attach = request.body.attach;
    const total_fee = request.body.total_fee;
    const skuList = JSON.parse(request.body.skuList);
    let user_id = 0;
    let feedback;


    __USER_DATABASE__
        .fetchUserOpenId(request.body)
        .then(function (request) {      //  作下调整
            const deferred = Q.defer();

            user_id = request.msg.uid;  //  传入统一订单接口所需的参数
            deferred.resolve({
                body: body,                         //  商品描述
                total_fee: total_fee,               //  商品金额，以分为单位
                openid: request.msg.openid,         //  用户的openid（小程序）
                out_trade_no: out_trade_no
            });
            return deferred.promise;
        })
        .then(__WX_PAY_SERVICE__.unifiedOrder)      //  调用统一订单接口
        .then(function (result) {
            __LOGGER__.debug(result);
            feedback = result;                      //  接口调用成功后，保存预返回的结果
            feedback.out_trade_no = out_trade_no;   //  带上订单编号

            const deferred = Q.defer();             //  生成要保存至数据库的订单数据
            deferred.resolve({
                order: {
                    out_trade_no: out_trade_no,
                    consignee_no: consignee_no,
                    user_id: user_id,
                    totalFee: total_fee,
                    attach: attach,
                    prepayID: result.prepay_id,
                    skuList: skuList
                }
            });
            return deferred.promise;
        })
        .then(__SHOPPING_DATABASE__.submitNewOrder) //  保存订单
        .then(function (result) {
            __LOGGER__.debug(result);
            response(feedback);                     //  返回
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 重新支付
 * @param request
 * @param response
 */
function repay(request, response) {
    __SHOPPING_DATABASE__
        .repay(request.body)                                 //  获取 prepay_id
        .then(res => {
            return Q({prepay_id: res.msg.prepayID});      //  转换
        })
        .then(__WX_PAY_SERVICE__.repay)                      //  签名
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// repay({
//     body: {
//         out_trade_no: '13297414012018060410570615783848',
//         session: 'j0TIyyyEBpppMuHRL7G2WnsindjQoJBj'
//     }
// }, res => {
//     'use strict';
//
// });

function closeOrder(request, response) {
    __SHOPPING_DATABASE__
        .checkSession(request.body)
        .then(__WX_PAY_SERVICE__.closeOrder)
        .then(__SHOPPING_DATABASE__.closeOrder)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// closeOrder({
//     body: {
//         session: "ldoJyPDWYDSLb7uYBftRhvRguogSt2cK",
//         out_trade_no: 'zONc9tfoLodZ4zLKnp2cY4uotDFJXVdr'
//     }
// }, (res) => {
//     'use strict';
//     console.log(res);
// });

/**
 *      获取订单列表
 *      -   取部分数据
 *
 * @param request
 * @param response
 */
function fetchOrderList(request, response) {
    __SHOPPING_DATABASE__
        .fetchOrderList(request.query)
        .then(result => {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *      后台 - 获取某订单详情
 * @param request
 * @param response
 */
function fetchAOrder(request, response) {
    __SHOPPING_DATABASE__
        .fetchAOrder({
            out_trade_no: request.params.out_trade_no,
            session: request.query.session
        })
        .then(result => {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

//fetchOrderList({
//    query: {
//        session: '5188hrY5siSKhcpUDr7L0AXV7JE5Ki3c',
//        startTime: '2018-05-25',
//        number: 20
//    }
//}, function (res) {
//    __LOGGER__.debug(res);
//});

//fetchAOrder({
//    params: {
//        out_trade_no: '13297414012018051910422182936742'
//    },
//    query: {
//        session: '5188hrY5siSKhcpUDr7L0AXV7JE5Ki3c'
//    }
//}, function (res) {
//    __LOGGER__.debug(res);
//})

/**
 *  超时未支付订单
 *      --  调用微信支付的关闭订单接口
 *      --  更新订单的状态
 * @param request
 * @param response
 */
function fetchOrderNotPayTimeout(request, response) {
    __SHOPPING_DATABASE__
        .fetchOrderNotPayTimeout({})
        .then(result => {
            if (result.code === 0) {
                for (let i = 0; i < result.msg.length; i++) {
                    __LOGGER__.debug(result.msg[i].out_trade_no);
                    __WX_PAY_SERVICE__.closeOrder({out_trade_no: result.msg[i].out_trade_no})
                        .then(__SHOPPING_DATABASE__.closeOrder)
                        .catch(function (exception) {
                            __LOGGER__.error(exception);
                            response(exception);
                        });
                }
            }
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 收到微信支付的结果通知
 *  { xml:
    * { appid: 'wxc91180e424549fbf',
    *     bank_type: 'CMB_DEBIT',
    *     cash_fee: '1',
    *     device_info: 'MINI-PROGRAM',
    *     fee_type: 'CNY',
    *     is_subscribe: 'N',
    *     mch_id: '1329741401',
    *     nonce_str: 'pe3QNjoV5ufZ6LzfVBhdsBNI5SZFs3pq',
    *     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc',
    *     out_trade_no: '132974140120180509165219',
    *     result_code: 'SUCCESS',
    *     return_code: 'SUCCESS',
    *     sign: 'D6D619048FB09A9435C366E1F877ACE6',
    *     time_end: '20180509165231',
    *     total_fee: '1',
    *     trade_type: 'JSAPI',
    *     transaction_id: '4200000137201805095946015615' } }
 * @param request
 * @param response
 */
function receivePayResultNotification(request, response) {
    //
    //  注意：
    // 同样的通知可能会多次发送给商户系统。商户系统必须能够正确处理重复的通知。
    // 推荐的做法是
    // 当收到通知进行处理时，首先检查对应业务数据的状态，判断该通知是否已经处理过
    //      --  如果没有处理过再进行处理
    //      --  如果处理过直接返回结果成功
    // 在对业务数据进行状态检查和处理之前，要采用数据锁进行并发控制，以避免函数重入造成的数据混乱。
    //
    //  特别提醒：
    // 商户系统对于支付结果通知的内容一定要做签名验证,并校验返回的订单金额是否与商户侧的订单金额一致
    // 防止数据泄漏导致出现“假通知”，造成资金损失

    // 商户处理后同步返回给微信参数：
    // <xml>
    //  <return_code><![CDATA[SUCCESS]]></return_code>
    //  <return_msg><![CDATA[OK]]></return_msg>
    // </xml>

    __WX_PAY_SERVICE__
        .handlePayResultNotification(request)
        .then(__SHOPPING_DATABASE__.updateOrderAfterPay)
        .then(function (result) {
            response(__UTIL__.format('<xml><return_code>%s</return_code><return_msg>%s</return_msg></xml>', 'SUCCESS', 'OK'));
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(__UTIL__.format('<xml><return_code>%s</return_code><return_msg>%s</return_msg></xml>', exception.return_code, exception.return_msg));
        });
}

/**
 * 查询订单
 * @param request
 * @param response
 */
function queryOrder(request, response) {
    __WX_PAY_SERVICE__
        .queryOrder({
            out_trade_no: request.params.id
        })
        .then(__SHOPPING_DATABASE__.fetchOrderDetail)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *      直接发起退款
 *
 * 用户的退款申请先到后台，再由后台调用接口进行退款
 *
 * @param request
 * @param response
 */
function refund(request, response) {
    __SHOPPING_DATABASE__
        .checkRefundPermission(request.body)
        .then(__WX_PAY_SERVICE__.Refund)
        .then(__SHOPPING_DATABASE__.submitNewRefund)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *      退款结果通知
 *
 * 当商户申请的退款有结果后，微信会把相关结果发送给商户，商户需要接收处理，并返回应答。
 * 推荐的做法是
 * 当收到通知进行处理时，首先检查对应业务数据的状态，判断该通知是否已经处理过，
 * 如果没有处理过再进行处理，
 * 如果处理过直接返回结果成功。
 * 在对业务数据进行状态检查和处理之前，要采用数据锁进行并发控制，以避免函数重入造成的数据混乱。
 * 特别说明：退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
 *
 * 解密方式:
 *  （1）对加密串A做base64解码，得到加密串B
 *  （2）对商户key做md5，得到32位小写key* ( key设置路径：微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置 )
 *  （3）用key*对加密串B做AES-256-ECB解密（PKCS7Padding）
 * @param request
 * @param response
 */

function receiveRefundResultNotification(request, response) {
    /**
     * 返回结果示例
     *  { xml:
     *      { return_code: 'SUCCESS',
     *        appid: 'wxc91180e424549fbf',
     *        mch_id: '1329741401',
     *        nonce_str: '4a1c8ed01026cc6dad887c4297f0d1e1',
     *        req_info: 'vgSb3f/TCDy6wyPK6XwpQkrw5pwLOg7+qpG......................'
     *      }
     *  }
     */
    __WX_PAY_SERVICE__
        .handleRefundResultNotification(request)
        .then(__SHOPPING_DATABASE__.changeRefundStatus)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(__UTIL__.format('<xml><return_code>%s</return_code><return_msg>%s</return_msg></xml>', 'SUCCESS', 'OK'));
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(__UTIL__.format('<xml><return_code>%s</return_code><return_msg>%s</return_msg></xml>', exception.return_code, exception.return_msg));
        });
}

/**
 *  查询退款进度
 *      --  后台用
 * @param request
 * @param response
 */
function fetchRefundInfo(request, response) {
    __SHOPPING_DATABASE__.fetchRefundInfo(request.body)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *  新增商品属性
 *      --  后台
 * @param request
 * @param response
 */
function newAttributes(request, response) {
    __SHOPPING_DATABASE__
        .addNewStockAttribute(request.body)
        .then(__SHOPPING_DATABASE__.addNewStockValue)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *  新增商品
 *      --  后台
 * @param request
 * @param response
 */
function newProduct(request, response) {
    __SHOPPING_DATABASE__
        .addNewProduct(request.body)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *  删除商品
 *      --  后台
 * @param request
 * @param response
 */
function removeProduct(request, response) {
    __SHOPPING_DATABASE__
        .removeProduct(request.query)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *  修改商品状态
 * @param request
 * @param response
 */
function changeProductStatus(request, response) {
    __SHOPPING_DATABASE__
        .changeProductStatus(request.body)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 检查用户是否已购买该商品
 * @param request
 * @param response
 */
function checkEverBought(request, response) {
    __SHOPPING_DATABASE__
        .checkEverBought(request.query)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// checkEverBought({
//     query: {
//         session: 'LGoYDvgNwbubZhDzfIPTLX5lAqPLmSSb',
//         stock_no: 'JVGpxGHPS5HAACbYOym0myzwMldtoo2H'
//     }
// }, res => {
//     'use strict';
//     console.log(res);
// });

/**
 * 获取状态为已投放的所有卡券列表
 * @param request
 * @param response
 */
function fetchDispatchCardList(request, response) {
    __USER_DATABASE__
        .checkIdentity(request.query)
        .then(__SERVICE_WECHAT_ACCESS_TOKEN__.accessToken)
        .then(data => {
            return Q({
                access_token: data.access_token,
                status_list: [
                    // __STRUCTURE__.__CARD_STATUS__.CARD_STATUS_VERIFY_OK,
                    __STRUCTURE__.__CARD_STATUS__.CARD_STATUS_DISPATCH
                ]
            });
        })
        .then(__SERVICE_WECHAT_SHOPPING_CARD__.batchQueryCardList)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 获取卡券详情
 * @param request
 * @param response
 */
function queryCardDetail(request, response) {
    __USER_DATABASE__
        .checkIdentity(request.query)
        .then(__SERVICE_WECHAT_ACCESS_TOKEN__.accessToken)
        .then(data => {
            return Q({
                access_token: data.access_token,
                card_id: request.params.id
            });
        })
        .then(__SERVICE_WECHAT_SHOPPING_CARD__.queryCardDetail)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 获取商品所关联卡券
 * @param request
 * @param response
 */
function queryProductCard(request, response) {
    __SHOPPING_DATABASE__
        .queryProductCard(request)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 在商品与卡券间建立关联
 * @param request
 * @param response
 */
function associateProductCard(request, response) {
    __SHOPPING_DATABASE__
        .associateProductCard(request.body)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 将卡券放入微信卡包
 * @param request
 * @param response
 */
function putCouponIntoCardHolder(request, response) {
    let params = {};

    __WX_PAY_SERVICE__
        .queryOrder({
            out_trade_no: request.out_trade_no
        })
        .then(data => {
            const deferred = Q.defer();

            if (data.return_code === 'SUCCESS' &&
                data.return_msg === 'OK' &&
                data.result_code === 'SUCCESS' &&
                data.trade_state === 'SUCCESS'
            ) {
                params = {
                    openid: data.openid,
                    session: request.session,
                    product_id: request.product_id
                };
                deferred.resolve(params);
            } else {
                deferred.reject('请支付成功后再领取卡券');
            }
            return deferred.promise;
        })
        .then(__SHOPPING_DATABASE__.checkProductCard)
        .then(packet => {
            const deferred = Q.defer();

            if (packet.code === 0 && packet.msg.length > 0) {
                params.card_id = packet.msg[0].cardId;
                deferred.resolve(params);
            } else {
                deferred.reject('未能找到该卡券');
            }

            return deferred.promise;
        })
        .then(__SERVICE_WECHAT_ACCESS_TOKEN__.accessToken)
        .then(__SERVICE_WECHAT_ACCESS_TOKEN__.cardAPITicket)
        .then(ticket => {
            return Q({
                openid: params.openid,
                card_id: params.card_id,
                ticket: ticket.ticket
            });
        })
        .then(__SERVICE_WECHAT_ACCESS_TOKEN__.signature)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 在用户领取卡券至微信卡包后，记录用户的领取记录
 * @param request
 * @param response
 */
function recordUserCard(request, response) {
    __SERVICE_WECHAT_ACCESS_TOKEN__
        .accessToken()
        .then(token => {
            return Q({
                access_token: token.access_token,
                encrypt_code: request.body.encrypt_code
            });
        })
        .then(__SERVICE_WECHAT_SHOPPING_CARD__.decryptCard)
        .then(code => {
            const deferred = Q.defer();

            if (code.errcode === 0) {
                deferred.resolve({
                    session: request.body.session,
                    cardid: request.body.cardid,
                    code: code.code,
                    openid: request.body.openid,
                    timestamp: __MOMENT__(request.body.timestamp, 'X').format('YYYY-MM-DD HH:mm:ss'),
                    out_trade_no: request.body.out_trade_no
                });
            } else {
                deferred.reject('Code解码时发生错误');
            }

            return deferred.promise;
        })
        .then(__SHOPPING_DATABASE__.recordUserCard)
        .then(result => {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 根据用户的订单号，查询相应的卡券列表
 * @param request
 * @param response
 */
function queryUserCards(request, response) {
    let tradeList = '';

    JSON.parse(request.body.tradeList).forEach(item => {
        tradeList += ',"' + item + '"';
    });
    tradeList = tradeList.slice(1);

    __SHOPPING_DATABASE__
        .queryUserCards({
            session: request.body.session,
            tradeList: tradeList
        })
        .then(result => {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 获取商户列表
 * @param request
 * @param response
 */
function fetchBusinessList(request, response) {
    __SHOPPING_DATABASE__
        .fetchBusinessList({
            session: request.query.session
        })
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 获取在线商户列表
 * @param request
 * @param response
 */
function fetchOnlineBusinessList(request, response) {
    __SHOPPING_DATABASE__
        .fetchOnlineBusinessList({
            session: request.query.session
        })
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 获取商户信息
 * @param request
 * @param response
 */
function fetchBusinessDetail(request, response) {
    __SHOPPING_DATABASE__
        .fetchBusinessDetail({
            session: request.query.session,
            bid: request.query.bid
        })
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

//fetchBusinessDetail({
//    query: {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        bid: 'IcsqXKApo7Kx4ekQohcZDcLhI3rV0r0G'
//    }
//}, (result) => {
//    'use strict';
//    __LOGGER__.debug(result);
//});

/**
 * 添加商户
 * @param request
 * @param response
 */
function addBusiness(request, response) {
    __SHOPPING_DATABASE__
        .addBusiness(request.body)
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 编辑商户
 * @param request
 * @param response
 */
function editBusiness(request, response) {
    __SHOPPING_DATABASE__
        .updateBusiness(request.body)
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 移除商户
 * @param request
 * @param response
 */
function deleteBusiness(request, response) {
    __SHOPPING_DATABASE__
        .deleteBusiness(request.query)
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 * 修改商户状态
 * @param request
 * @param response
 */
function changeBusinessStatus(request, response) {
    __SHOPPING_DATABASE__
        .changeBusinessStatus(request.body)
        .then(result => {
            response(result);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            response(exception);
        });
}

//addBusiness({
//    body: {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        business: '{"type":"32","name":"瓜博士","address":"莆田市城厢区学园中街吉祥如意楼瓜博士（安福妈祖文化研究院旁）","longitude":119.017532,"latitude":25.4478,"shopHours":"11:00-14:00 ；17:00-03:00","phone":"0594-2568777","comsuptionPerPersion":"￥60+","remark":"福利一：吃货队粉丝享受全场菜金5折>的特权；（酒水锅底饮料除外，仅限堂食）\\n\\n福利二：享受吃多少送多少的特权（送的充值金额可在下次消费时无门槛抵用）\\n\\n活动时间：8月4号 -8月11号，福利一福利二不可同享","associatedProductPid":"","associatedMaterialId":""}'
//    }
//}, () => {
//});

// queryUserCards({
//     body: {
//         session: 'o6ieHVpjL2R8ENeEQ5xs9cr8ObDLx5ur',
//         tradeList: JSON.stringify(['13297414012018071610083182225789', '13297414012018071809202654433464'])
//     }
// }, () => {
// });

//recordUserCard({
//    body: {
//        encrypt_code: 'nefwNaZkRG/Q5e8SHDK3gsi6q6OquuegeaNCoe6u0EY=',
//        session: '7b8HiDEvCRzKihXtUIORejRRnUnoQMtu',
//        cardid: 'pWWirwY_iHgLxsMdeP858iyD2744',
//        openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc',
//        timestamp: '1531876848',
//        out_trade_no: '13297414012018071809202654433464'
//    }
//}, () => {
//});

// putCouponIntoCardHolder({
//     out_trade_no: '13297414012018071614440696447168',
//     session: 'nCuDTm5pe3Wl4gAAsn6jEQvm8GouXltg',
//     product_id: 'MFEZM9sbAmbm2fkEyj34Egl5XozYWtpK'
// }, res => {
// });

// associateProductCard({
//     body: {
//         session: '0sO6soyPNFoLXPqZlgxXl51G1s8ctuOU',
//         product_id: 'MFEZM9sbAmbm2fkEyj34Egl5XozYWtpK',
//         card_id: 'pn9h6uEjxnBRBZAv-fMj1lmt8Fjc'
//     }
// }, () => {
// });

// queryProductCard({
//     params: {
//         product_id: ''
//     },
//     query: {
//         session: '0sO6soyPNFoLXPqZlgxXl51G1s8ctuOU'
//     }
// }, () => {
// });

//fetchDispatchCardList({
//    query: {
//        session: ''
//    }
//}, () => {
//});

//queryCardDetail({
//    query: {session: '0sO6soyPNFoLXPqZlgxXl51G1s8ctuOU'},
//    params: {id: 'pWWirwadTzPNcwpiS1Am5nMU0XhE'}
//}, () => {
//});

// newProduct({
//     body: {
//         session: 'kGKs01p7ONomrPWeGKdopUv1HbXcdQlZ',
//         product: '{"name":"测试","introduce":"测试","attributes":[{"aid":1,"name":"大小","values":[{"vid":2,"value":"S"},{"vid":4,"value":"M"}]},{"aid":3,"name":"颜色","values":[{"vid":17,"value":"红色"}]}],"sku":[{"unit":0,"amount":0,"vids":"2,17,","大小":"S","颜色":"红色"},{"unit":0,"amount":0,"vids":"4,17,","大小":"M","颜色":"红色"}],"thumbnails":[{"imageId":"xfUDj7y9JWZVwIeubGEht1vdXfljKMlc","type":0}],"details":[{"imageId":"xfUDj7y9JWZVwIeubGEht1vdXfljKMlc","type":1}]}'
//     }
// }, function (res) {
//     console.log(res);
// });

// changeProductStatus({
//     body: {
//         status: 1,
//         productid: 'lJfQQu4AQGmxNCwfwrpzBnvxk9nRus2z'
//     }
// }, res => {
//     'use strict';
//
// });


module.exports = {
    submitUnifiedOrder: submitUnifiedOrder,
    repay: repay,
    queryOrder: queryOrder,
    closeOrder: closeOrder,
    fetchOrderList: fetchOrderList,
    fetchAOrder: fetchAOrder,
    fetchOrderNotPayTimeout: fetchOrderNotPayTimeout,
    receivePayResultNotification: receivePayResultNotification,
    fetchProductList: fetchProductList,
    fetchPartialProductList: fetchPartialProductList,
    fetchProductDetail: fetchProductDetail,
    refund: refund,
    receiveRefundResultNotification: receiveRefundResultNotification,
    fetchRefundInfo: fetchRefundInfo,
    newAttributes: newAttributes,
    newProduct: newProduct,
    removeProduct: removeProduct,
    changeProductStatus: changeProductStatus,
    checkEverBought: checkEverBought,
    fetchDispatchCardList: fetchDispatchCardList,
    queryCardDetail: queryCardDetail,
    queryProductCard: queryProductCard,
    associateProductCard: associateProductCard,
    putCouponIntoCardHolder: putCouponIntoCardHolder,
    recordUserCard: recordUserCard,
    queryUserCards: queryUserCards,
    fetchBusinessList: fetchBusinessList,
    fetchOnlineBusinessList: fetchOnlineBusinessList,
    fetchBusinessDetail: fetchBusinessDetail,
    addBusiness: addBusiness,
    editBusiness: editBusiness,
    deleteBusiness: deleteBusiness,
    changeBusinessStatus: changeBusinessStatus
};

//fetchRefundInfo({
//    body: {
//        session: 'oRKfQ0wn5FvfGsQi6BkperbYPEA5Dp3l',
//        out_trade_no: '13297414012018052214015068882433'
//    }
//}, res => {
//    'use strict';
//    console.log(res);
//})

//receiveRefundResultNotification({
//    body: {
//        xml: {
//            return_code: 'SUCCESS',
//            appid: 'wxc91180e424549fbf',
//            mch_id: '1329741401',
//            nonce_str: 'ef619897834ff5d9c7e5a1cbcc5dd600',
//            req_info: 'vgSb3f/TCDy6wyPK6XwpQkrw5pwLOg7+qpGR5xsddVsdXHQi4esS3Hjt1S2ulD9m/E1PWf+iQ2Rv3uSvyJESaxBt54o4UhiOXKHyZf2IWUoILiAnD7b9+u7eXH7dFJXX4UKiYGA7jH0eqljaIlhKNLbbUbWug9Jx9mN30FquCs8r3nXuqGasoibkLhyLeX1QsOPJ2fwvsEatwGIau9VwIO3hSRzlSvq8eR/DMOBcjzKiTVGI/tK03qwgA2yPbELP1tSbMh3HEeXMi6Iv02hgXBh3oY3q+6ePCJxN5jMgmca6oqRllj312WOkepSuKVEQapxc86hR1ilbCmjXTcJFkC+VN7Ruxj6okuLzoU+kVdFH4SyuyOz5yEk1Y/rykK7xrpDAFcOMYFjgZexpFdYLVcT+dVsF5lHQRw/FZRPoPn1JI6ZcqLqFnsMzTb/PFtmgyyQR8W6SZIbwYzaJ5ZlBjLovxXAFDF+7lWR0EwslpLLuPDfS0NZmwqk87JZEyN2TccaKN8wAhUusS8Mb6MjzHtVe9CjSWPp4vLwcLpFMx82HN2wYuvKZiJrPjvqByovF0KaoHdiHKkzEUyFYbKOPTWUKtCkCI2Wc6N8EfVEvVvTVmzghYoItC21OFORdMxGvYErj4/GNjTtBXHk+Bp2G0wRMc1fw90zMpZ6iMmThPvN8iGxCwkRNAbaImLXboiTg8pTQRNdJMl64hfFrSyCacGySP5ipEkwubGY+jUF8HyvsGo3R+zzqleAHOJJi6rqBQDVI16V45RZyQOwz3+GienTvsWTAv/hhchW+CvsWdhx2Z7arCPWFyQMkPNytoBtZlm6fQJJMkS8ym4BzHxKXi7r+7dbRGx3VCoZvfxDvVAEmI55TSWdvDWj0ehJNzd2a2FcOpjirUNZNrq2j78pDkg7FSPtyskG/OYPZUQW8mjAGC5K6wJl+RgbaIzLCDr6B5vvV2QhHJUK9xEG39uFMH5LzqCArZhAZHXRzsbcGBAQwRBowOP037oYY0MUlA6t7fQONWyWBDLkFaxZgRBcXbtDUgN9331CPRBf2Kbehx64r6x4yqjjKS4cOb7c3MVkzWWuBDxv83r/sxwtju1Z1SA=='
//        }
//    }
//}, function (res) {
//
//});

// refund({
//     body: {
//         out_trade_no: '13297414012018052214015068882433',
//         out_refund_no: '13297414012018052214115944426193',
//         total_fee: 1,
//         refund_fee: 1,
//         session: 'oRKfQ0wn5FvfGsQi6BkperbYPEA5Dp3l'
//     }
// }, function (res) {
//     __LOGGER__.debug(res);
// });

// queryOrder({
//     params: {
//         id: '13297414012018051910422182936742'
//     }
// }, function (res) {
//     __LOGGER__.debug(res);
// });

//submitUnifiedOrder({
//    body: {
//        body: 'BODY     ------      测试订单',
//        attach: 'ATTACH     ------      测试订单',
//        total_fee: 11,
//        session: 'v2oywgcg1AyBjVfQ3n0vgJyVD1npJZNP',
//        consignee_no: 'E9uSMDOvlTBItMINN4GY66z6hGzTh9xv',
//        skuList: [
//            {stock_no: 'gUKvRPUIP8R5LmmFm67csknO35fz2Mhl', amount: 0},
//            {stock_no: 'JZtt2fIe5UcVTo3exOqddkuZDbMgQjks', amount: 2},
//            {stock_no: 'NoD1fgBx5ncrtWnO9wIGLf5AsxRSjfVz', amount: 3},
//            {stock_no: 'RVwHEVMTUBOt2xRpu8l8wNHMo9g8uhi5', amount: 1},
//            {stock_no: 'vtTzYJot4LO30kM7YO8FDdzR1pyYHosY', amount: 0}
//        ]
//
//    }
//}, function (res) {
//    __LOGGER__.debug(res);
//});

// fetchProductDetail(
//     {
//         params: {
//             id: 'W7kmHOCNkVHCeDzy3lS2RJZSUnXgHSQL'
//         }
//     }
//     , function (res) {
//         __LOGGER__.debug(res);
//     });

// fetchProductList({}, function (res) {
//     // __LOGGER__.debug(res);
// });
// submitUnifiedOrder({
//     body: {
//         body: '测试',
//         total_fee: 1,
//         openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
//     }
// }, function (res) {
//
// });

//receivePayResultNotification({
//    body: {
//        xml: {
//            appid: 'wxc91180e424549fbf',
//            bank_type: 'CFT',
//            cash_fee: '1',
//            device_info: 'MINI-PROGRAM',
//            fee_type: 'CNY',
//            is_subscribe: 'N',
//            mch_id: '1329741401',
//            nonce_str: 'C9e3zjQEArIdkpgixe5WLssJ0O4RdAe1',
//            openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc',
//            out_trade_no: '13297414012018051913213982583196',
//            result_code: 'SUCCESS',
//            return_code: 'SUCCESS',
//            sign: 'E727A98EE59256C0308190ECA2049EC0',
//            time_end: '20180519134743',
//            total_fee: '2',
//            trade_type: 'JSAPI',
//            transaction_id: '4200000127201805193260685915'
//        }
//
//    }
//}, function (result) {
//    __LOGGER__.debug(result);
//});

//changeBusinessStatus({
//    body: {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        status: 1,
//        bid: 'cnXTviQSBc5KjslME6OH47RCP7bdbKeH'
//    }
//}, () => {
//    'use strict';
//});

//editBusiness({
//    body: {
//        session: 'yVOCw3GSn7XjH45up9mGclQ43XjYCZ1k',
//        business: '{"bid":"IcsqXKApo7Kx4ekQohcZDcLhI3rV0r0G","type":32,"name":"瓜博士","address":"莆田市城厢区学园中街吉祥如意楼瓜博士（安福妈祖文化研究院旁）","longitude":119.0175323,"latitude":25.4477997,"shopHours":"11:00-14:00 ；17:00-03:00","phone":"0594-2568777","consumptionPerPerson":"￥60+","remark":"福利一：吃货队粉丝享受全场菜金5折的特权；（酒水锅底饮料除外，仅限堂食）\\n\\n福利二：享受吃多少送多少的特权（送的充值金额可在下次消费>时无门槛抵用）\\n\\n活动时间：8月4号 -8月11号，福利一福利二不可同享","associatedProductPid":"ZQ1IkvOcxbKP8ZqxsfBByfA6DlT8djJy","associatedMaterialId":"n584HX_l4p6cYQBacvvsyynyglNzjRVWMs9vOmDVt6U"}'
//    }
//}, result => {
//    'use strict';
//    console.log(result);
//})
