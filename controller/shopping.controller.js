const __UTIL__ = require('util');
const __WX_PAY_SERVICE__ = require('../services/wechat.pay/wechat.pay.service');
const __SHOPPING_DATABASE__ = require('../database/shopping.api');
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.controller.js');

/**
 *   获取商品列表
 *
 * @param request
 * @param response
 */
function fetchProductList(request, response) {

    __SHOPPING_DATABASE__
        .fetchProductList(request)
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
 * 提交统一订单
 * @param request
 * @param response
 */
function submitUnifiedOrder(request, response) {

    __WX_PAY_SERVICE__
        .unifiedOrder({
            body: request.body.body,
            total_fee: request.body.total_fee,
            openid: request.body.openid
        })
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
 * 查询订单
 * @param request
 * @param response
 */
function queryOrder(request, response) {

    __WX_PAY_SERVICE__
        .queryOrder({
            out_trade_no: request.params.id
        })
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

module.exports = {
    submitUnifiedOrder: submitUnifiedOrder,
    queryOrder: queryOrder,
    receivePayResultNotification: receivePayResultNotification,
    fetchProductList: fetchProductList
};

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

// receivePayResultNotification({
//     body: {
//         xml: {
//             appid: 'wxc91180e424549fbf',
//             bank_type: 'CMB_DEBIT',
//             cash_fee: '1',
//             device_info: 'MINI-PROGRAM',
//             fee_type: 'CNY',
//             is_subscribe: 'N',
//             mch_id: '1329741401',
//             nonce_str: 'pe3QNjoV5ufZ6LzfVBhdsBNI5SZFs3pq',
//             openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc',
//             out_trade_no: '132974140120180509165219',
//             result_code: 'SUCCESS',
//             return_code: 'SUCCESS',
//             sign: 'D6D619048FB09A9435C366E1F877ACE6',
//             time_end: '20180509165231',
//             total_fee: '1',
//             trade_type: 'JSAP',
//             transaction_id: '4200000137201805095946015615'
//         }
//     }
// }, function (result) {
//
// });