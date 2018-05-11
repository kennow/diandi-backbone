const Q = require('q');
const __WX_PAY_HELPER__ = require('./wechat.pay.helper');
const __WX_PAY_API__ = require('./wechat.pay.api.url');
const __WX_PAY_DATA__ = require('./wechat.pay.data.structure');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.pay.service.js');

/**
 * 统一下单
 * 商户在小程序中先调用该接口在微信支付服务后台生成预支付交易单，返回正确的预支付交易后调起支付
 * @param request
 */
function unifiedOrder(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructUnifiedOrderParams(request));
    __LOGGER__.debug(postData);

    // 调用统一下单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__UNIFIED_ORDER__, postData, function (rawData) {
        __WX_PAY_DATA__
            .parseReturnUnifiedOrder(rawData)       // 对返回结果进行解析【XML转JSON】
            .then(__WX_PAY_HELPER__.checkSign)      // 验证结果的正确性
            .then(function (result) {             // 确认无误后回传给 Controller
                const wxPayResult = __WX_PAY_DATA__.constructWechatPayResult(result);
                // 回传参数：outTradeNo | timeStamp | nonceStr | package | paySign
                deferred.resolve({
                    return_code: result.return_code,
                    return_msg: result.return_msg,
                    timeStamp: wxPayResult.timeStamp,
                    nonceStr: wxPayResult.nonceStr,
                    package: wxPayResult.package,
                    paySign: wxPayResult.paySign
                });
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    });

    return deferred.promise;
}

/**
 * 以下情况需要调用关单接口：
 *      1.  商户订单支付失败需要生成新单号重新发起支付，要对原订单号调用关单，避免重复支付；
 *      2.  系统下单后，用户支付超时，系统退出不再受理，避免用户继续，请调用关单接口。
 * @param request
 */
function closeOrder(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructCloseOrderParams(request));
    __LOGGER__.debug(postData);

    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__CLOSE_ORDER__, postData, function (result) {
        deferred.resolve(result);
    });

    return deferred.promise;
}

/**
 * 该接口提供所有微信支付订单的查询，商户可以通过查询订单接口主动查询订单状态，完成下一步的业务逻辑。
 *        需要调用查询接口的情况：
 *        ◆ 当商户后台、网络、服务器等出现异常，商户系统最终未接收到支付通知；
 *        ◆ 调用支付接口后，返回系统错误或未知交易状态情况；
 *        ◆ 调用刷卡支付API，返回USERPAYING的状态；
 *        ◆ 调用关单或撤销接口API之前，需确认支付状态；
 * @param request
 */
function queryOrder(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructQueryOrderParams(request));
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__ORDER_QUERY__, postData, function (rawData) {
        __WX_PAY_DATA__
            .parseReturnQueryOrder(rawData)       // 对返回结果进行解析【XML转JSON】
            .then(function (result) {             // 确认无误后回传给 Controller
                deferred.resolve(result);
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    });

    return deferred.promise;
}

function handlePayResultNotification(request) {
    return __WX_PAY_HELPER__.checkSign(request.body.xml);
}

/**
 * 商户可以通过该接口下载历史交易清单
 * 比如掉单、系统错误等导致商户侧和微信侧数据不一致，通过对账单核对后可校正支付状态。
 * 注意：
 *  1、微信侧未成功下单的交易不会出现在对账单中。支付成功后撤销的交易会出现在对账单中，跟原支付单订单号一致；
 *  2、微信在次日9点启动生成前一天的对账单，建议商户10点后再获取；
 *  3、对账单中涉及金额的字段单位为“元”。
 *  4、对账单接口只能下载三个月以内的账单。
 * @param request
 */
function downloadBill(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructDownloadBillParams(request));
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__DOWNLOAD_BILL__, postData, function (result) {

    });

    return deferred.promise;
}

/**
 * 商户可以通过该接口下载自2017年6月1日起 的历史资金流水账单。
 * 说明：
 *  1、资金账单中的数据反映的是商户微信账户资金变动情况；
 *  2、当日账单在次日上午9点开始生成，建议商户在上午10点以后获取；
 *  3、资金账单中涉及金额的字段单位为“元”。
 * @param request
 */
function downloadFundFlow(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructDownladFundFlowParams(request));
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__DOWNLOAD_FUND_FLOW__, postData, function (result) {

    });

    return deferred.promise;
}

module.exports = {
    unifiedOrder: unifiedOrder,
    closeOrder: closeOrder,
    queryOrder: queryOrder,
    handlePayResultNotification: handlePayResultNotification
};

// unifiedOrder({
//     body: 'body',
//     attach: 'attach',
//     total_fee: 1,
//     goods_tag: 'nice',
//     notify_url: 'http://www.baidu.com',
//     spbill_create_ip: '192.168.0.2',
//     // openid: 'osCkO0a1sPv2YDNBIAw7wFXlTib4'    //  莆素
//     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
// });

// closeOrder({
//    out_trade_no: '132974140120180506095421'
// });

// queryOrder({
//    out_trade_no: '132974140120180506104719'
// });

// downloadBill({});

//downloadFundFlow({});