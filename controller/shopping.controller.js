const Q = require('q');
const __UTIL__ = require('util');
const __WX_PAY_HELPER__ = require('../services/wechat.pay/wechat.pay.helper');
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
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

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
    var user_id = 0;
    var feedback;


    __SHOPPING_DATABASE__
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

module.exports = {
    submitUnifiedOrder: submitUnifiedOrder,
    queryOrder: queryOrder,
    receivePayResultNotification: receivePayResultNotification,
    fetchProductList: fetchProductList,
    fetchProductDetail: fetchProductDetail
};

// queryOrder({
//     params: {
//         id: '13297414012018051917224152133861'
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
//             id: 'lJfQQu4AQGmxNCwfwrpzBnvxk9nRus2z'
//         }
//     }
//     , function (res) {
//         // __LOGGER__.debug(res);
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