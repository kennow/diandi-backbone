const MOMENT = require('moment');
const __HELPER__ = require('../../utility/helper');
const __WX_PAY_CONFIG__ = require('./wechat.pay.config');
const __WX_PAY_HELPER__ = require('./wechat.pay.helper');
const __WX_PAY_API__ = require('./wechat.pay.api.url');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require("../log4js.service").getLogger("wechat.pay.service.js");

/**
 * 统一下单
 * 商户在小程序中先调用该接口在微信支付服务后台生成预支付交易单，返回正确的预支付交易后调起支付
 * @param request
 */
function unifiedOrder(request) {
    const params = {
        body: request.body,
        attach: request.attach,
        out_trade_no: __WX_PAY_CONFIG__.__MCH_ID__ + MOMENT().format('YYYYMMDDHHmmss'),
        total_fee: request.total_fee,
        time_start: MOMENT().format('YYYYMMDDHHmmss'),
        time_expire: MOMENT().add(5, 'minutes').format('YYYYMMDDHHmmss'),
        goods_tag: request.goods_tag,
        notify_url: request.notify_url,
        trade_type: 'JSAPI',
        openid: request.openid,
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        spbill_create_ip: request.spbill_create_ip || __WX_PAY_CONFIG__.__SPBILL_CREATE_IP__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);
    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(params);
    __LOGGER__.debug(postData);
    // 调用统一下单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__UNIFIED_ORDER__, postData, function (result) {
        //返回结果：<xml><return_code><![CDATA[SUCCESS]]></return_code>
        //<return_msg><![CDATA[OK]]></return_msg>
        //<appid><![CDATA[wx0a72bd7d41e0b066]]></appid>
        //<mch_id><![CDATA[1329741401]]></mch_id>
        //<nonce_str><![CDATA[JYlIYkHueaY8J7bv]]></nonce_str>
        //<sign><![CDATA[70CDD14430F4594F706A37E27CA880E8]]></sign>
        //<result_code><![CDATA[SUCCESS]]></result_code>
        //<prepay_id><![CDATA[wx0609214663444085e077d4d73018088839]]></prepay_id>
        //<trade_type><![CDATA[JSAPI]]></trade_type>
        //</xml>
    })
}

/**
 * 以下情况需要调用关单接口：
 *      1.  商户订单支付失败需要生成新单号重新发起支付，要对原订单号调用关单，避免重复支付；
 *      2.  系统下单后，用户支付超时，系统退出不再受理，避免用户继续，请调用关单接口。
 * @param request
 */
function closeOrder(request) {
    const params = {
        out_trade_no: request.out_trade_no,
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);
    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(params);
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__CLOSE_ORDER__, postData, function (result) {

    });
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
    const params = {
        out_trade_no: request.out_trade_no,
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);
    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(params);
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__ORDER_QUERY__, postData, function (result) {

    });
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
    const params = {
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        bill_date: request.bill_date || MOMENT().subtract(2, 'days').format('YYYYMMDD'),            // 默认查询前一天
        bill_type: request.bill_type || __WX_PAY_CONFIG__.__BILL_TYPE__.ALL,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);
    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(params);
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__DOWNLOAD_BILL__, postData, function (result) {

    });
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
    const params = {
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        bill_date: request.bill_date || MOMENT().subtract(2, 'days').format('YYYYMMDD'),            // 默认查询前一天
        account_type: request.account_type || 'Basic',
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);
    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(params);
    __LOGGER__.debug(postData);
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__DOWNLOAD_FUND_FLOW__, postData, function (result) {

    });
}

module.exports = {
    unifiedOrder: unifiedOrder,
    closeOrder: closeOrder,
    queryOrder: queryOrder
};

//unifiedOrder({
//    body: 'body',
//    attach: 'attach',
//    total_fee: 1,
//    goods_tag: 'nice',
//    notify_url: 'http://www.baidu.com',
//    spbill_create_ip: '192.168.0.2',
//    openid: 'osCkO0a1sPv2YDNBIAw7wFXlTib4'
//});

//closeOrder({
//    out_trade_no: '132974140120180506095421'
//});

//queryOrder({
//    out_trade_no: '132974140120180506104719'
//});

//downloadBill({});

//downloadFundFlow({});