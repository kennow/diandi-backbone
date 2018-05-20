const Q = require('q');
const MOMENT = require('moment');
const __XML_PARSER__ = require('xml2js').parseString;
const __HELPER__ = require('../../utility/helper');
const __WX_PAY_CONFIG__ = require('./wechat.pay.config');
const __WX_PAY_HELPER__ = require('./wechat.pay.helper');

/**
 *
 *      解析统一支付接口的返回数据
 *
 *  <xml><return_code><![CDATA[SUCCESS]]></return_code>
 * <return_msg><![CDATA[OK]]></return_msg>
 * <appid><![CDATA[wxc91180e424549fbf]]></appid>
 * <mch_id><![CDATA[1329741401]]></mch_id>
 * <nonce_str><![CDATA[GixSRvy8xe61TBba]]></nonce_str>
 * <sign><![CDATA[B1874930CA010919E945BB544BD38BE2]]></sign>
 * <result_code><![CDATA[SUCCESS]]></result_code>
 * <prepay_id><![CDATA[wx0815531377255427d682f7ae0536971846]]></prepay_id>
 * <trade_type><![CDATA[JSAPI]]></trade_type>
 * </xml>
 * @param rawData
 * @returns {*|promise}
 */
function parseReturnUnifiedOrder(rawData) {
    const deferred = Q.defer();

    __XML_PARSER__(rawData, function (err, result) {
        if (result.xml.return_code[0] !== 'SUCCESS') {
            deferred.reject({
                return_code: result.xml.return_code[0],
                return_msg: result.xml.return_msg[0]
            });
        } else {
            const data = {
                return_code: result.xml.return_code[0],                         // 通信标识，非交易标识
                return_msg: result.xml.return_msg[0],                           // 返回信息，如非空，为错误原因
                appid: result.xml.appid[0],                                     // 调用接口提交的小程序ID
                mch_id: result.xml.mch_id[0],                                   // 调用接口提交的商户号
                device_info: result.xml.device_info[0],
                nonce_str: result.xml.nonce_str[0],                             // 微信返回的随机字符串
                sign: result.xml.sign[0],                                       // 微信返回的签名值
                result_code: result.xml.result_code[0],                         // 业务结果
                prepay_id: result.xml.prepay_id[0],  // 微信生成的预支付会话标识，用于后续接口调用中使用，该值有效期为2小时
                trade_type: result.xml.trade_type[0]                            // 交易类型
            };
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 *
 *      解析查询订单接口的返回数据
 *
 * @param rawData
 * @returns {*|promise}
 */
function parseReturnQueryOrder(rawData) {
    const deferred = Q.defer();

    __XML_PARSER__(rawData, function (err, result) {
        if (result.xml.return_code[0] !== 'SUCCESS') {
            deferred.reject({
                return_code: result.xml.return_code[0],
                return_msg: result.xml.return_msg[0]
            });
        } else {
            if(result.xml.result_code[0] === 'SUCCESS'){
                if(result.xml.trade_state[0] === 'SUCCESS'){
                    // TODO: 在return_code 、result_code、trade_state都为SUCCESS的情况下
                    // TODO: 增加更多回传字段
                }else{
                    // 如果trade_state不为 SUCCESS，则只返回out_trade_no（必传）和attach（选传）
                    deferred.resolve({
                        return_code: result.xml.return_code[0],        // 通信标识，非交易标识
                        return_msg: result.xml.return_msg[0],          // 返回信息，如非空，为错误原因
                        result_code: result.xml.result_code[0],        // 业务结果
                        out_trade_no: result.xml.out_trade_no[0],      // 商户系统内部订单号
                        trade_state: result.xml.trade_state[0],        // 交易状态
                        trade_state_desc: result.xml.trade_state_desc[0]    // 对当前查询订单状态的描述和下一步操作的指引
                    });
                }
            }
            else{
                deferred.resolve({
                    return_code: result.xml.return_code[0],        // 通信标识，非交易标识
                    return_msg: result.xml.return_msg[0],          // 返回信息，如非空，为错误原因
                    // appid: result.xml.appid[0],                    // 调用接口提交的小程序ID
                    // mch_id: result.xml.mch_id[0],                  // 调用接口提交的商户号
                    // nonce_str: result.xml.nonce_str[0],            // 微信返回的随机字符串
                    // sign: result.xml.sign[0],                      // 微信返回的签名值
                    result_code: result.xml.result_code[0],        // 业务结果
                    err_code: result.xml.err_code[0],              // 错误码
                    err_code_des: result.xml.err_code_des[0]       // 结果信息描述
                });
            }
        }
    });

    return deferred.promise;
}

/**
 * 构造微信支付结果
 * @returns {*|promise}
 */
function constructWechatPayResult(request) {
    const wxPayResult = {
        appId: __WX_PAY_CONFIG__.__APP_ID__,                    // 调用接口提交的小程序ID
        timeStamp: __HELPER__.getTimestamp(),
        nonceStr: __HELPER__.getNonceStr(32),
        package: 'prepay_id=' + request.prepay_id,
        signType: 'MD5'
    };
    wxPayResult.paySign = __WX_PAY_HELPER__.makeSign(wxPayResult, __WX_PAY_CONFIG__.__KEY__);

    return wxPayResult;
}

/**
 * 构建微信支付 统一订单 接口参数
 * @param request
 * @returns {*|promise}
 */
function constructUnifiedOrderParams(request) {
    const params = {
        appid: __WX_PAY_CONFIG__.__APP_ID__,                        //  微信分配的小程序ID
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,                       //  微信支付分配的商户号
        device_info: request.device_info || 'MINI-PROGRAM',         //  自定义参数，可以为终端设备号(门店号或收银设备ID)
        nonce_str: __HELPER__.getNonceStr(32),                      //  随机字符串
        sign_type: request.sign_type || 'MD5',                      //  签名类型，默认为MD5，支持HMAC-SHA256和MD5
        body: request.body,                                         //  商品简单描述
        detail: request.detail || '',                               //  商品详细描述
        attach: request.attach || '',                               //  附加数据，在查询API和支付通知中原样返回
        out_trade_no: request.out_trade_no,                         //  商户系统内部订单号
        fee_type: request.fee_type || 'CNY',                        //  符合ISO 4217标准的三位字母代码，默认人民币：CNY
        total_fee: request.total_fee,                               //  订单总金额
        spbill_create_ip: request.spbill_create_ip || __WX_PAY_CONFIG__.__SPBILL_CREATE_IP__,   //  APP和网页支付提交用户端ip
        time_start: MOMENT().format('YYYYMMDDHHmmss'),              //  订单生成时间
        time_expire: MOMENT().add(5, 'minutes').format('YYYYMMDDHHmmss'),   //  订单失效时间
        goods_tag: request.goods_tag || '',                         //  订单优惠标记，使用代金券或立减优惠功能时需要的参数
        notify_url: __WX_PAY_CONFIG__.__NOTIFY_URL__,               //  异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数
        trade_type: 'JSAPI',                                        //  交易类型
        product_id: request.product_id || '',                       //  trade_type=NATIVE时（即扫码支付），此参数必传。此参数为二维码中包含的商品ID，商户自行定义
        limit_pay: request.limit_pay || '',                         //  上传此参数no_credit--可限制用户不能使用信用卡支付
        openid: request.openid                                      //  trade_type=JSAPI，此参数必传，用户在商户appid下的唯一标识
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);

    return params;
}

/**
 * 构造关闭订单接口参数
 * @param request
 * @returns {{out_trade_no: (string|*), appid: string, mch_id: string, nonce_str: string}}
 */
function constructCloseOrderParams(request) {
    const params = {
        out_trade_no: request.out_trade_no,
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);

    return params;
}

/**
 * 构造查询订单接口参数
 * @param request
 * @returns {{out_trade_no: (*|string), appid: string, mch_id: string, nonce_str: string}}
 */
function constructQueryOrderParams(request) {
    const params = {
        out_trade_no: request.out_trade_no,
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);

    return params;
}

/**
 * 构造下载历史交易清单的接口参数
 * @param request
 * @returns {{appid: string, bill_date: string, bill_type: string, mch_id: string, nonce_str: string}}
 */
function constructDownloadBillParams(request) {
    const params = {
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        bill_date: request.bill_date || MOMENT().subtract(2, 'days').format('YYYYMMDD'),            // 默认查询前一天
        bill_type: request.bill_type || __WX_PAY_CONFIG__.__BILL_TYPE__.ALL,
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);

    return params;
}

/**
 * 构造历史资金流水账单的接口参数
 * @param request
 * @returns {{appid: string, bill_date: string, account_type: string, mch_id: string, nonce_str: string}}
 */
function constructDownladFundFlowParams(request) {
    const params = {
        appid: __WX_PAY_CONFIG__.__APP_ID__,
        bill_date: request.bill_date || MOMENT().subtract(2, 'days').format('YYYYMMDD'),            // 默认查询前一天
        account_type: request.account_type || 'Basic',
        mch_id: __WX_PAY_CONFIG__.__MCH_ID__,
        nonce_str: __HELPER__.getNonceStr(32)
    };
    // 生成签名
    params.sign = __WX_PAY_HELPER__.makeSign(params, __WX_PAY_CONFIG__.__KEY__);

    return params;
}

module.exports = {
    parseReturnUnifiedOrder: parseReturnUnifiedOrder,
    parseReturnQueryOrder:parseReturnQueryOrder,
    constructUnifiedOrderParams: constructUnifiedOrderParams,
    constructWechatPayResult: constructWechatPayResult,
    constructCloseOrderParams: constructCloseOrderParams,
    constructQueryOrderParams: constructQueryOrderParams,
    constructDownloadBillParams: constructDownloadBillParams,
    constructDownladFundFlowParams: constructDownladFundFlowParams
};