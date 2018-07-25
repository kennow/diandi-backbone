const Q = require('q');
const __FILE_SYSTEM__ = require('fs');
const __PATH__ = require('path');
const __WX_PAY_HELPER__ = require('./wechat.pay.helper');
const __WX_PAY_API__ = require('./wechat.pay.api.url');
const __WX_PAY_DATA__ = require('./wechat.pay.data.structure');
const __WX_PAY_CONFIG__ = require('./wechat.pay.config');
const __HTTP_CLIENT__ = require('../http.client');
const __ERROR_CODE__ = require('../../utility/error.code');
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
            .then(function (result) {               // 确认无误后回传给 Controller
                if (result.return_code === 'SUCCESS' &&
                    result.return_msg === 'OK'
                ) {
                    const wxPayResult = __WX_PAY_DATA__.constructWechatPayResult(result);
                    // 回传参数：outTradeNo | timeStamp | nonceStr | package | paySign
                    deferred.resolve({
                        return_code: result.return_code,
                        return_msg: result.return_msg,
                        timeStamp: wxPayResult.timeStamp,
                        nonceStr: wxPayResult.nonceStr,
                        prepay_id: result.prepay_id,
                        package: wxPayResult.package,
                        paySign: wxPayResult.paySign
                    });
                }
                else {
                    deferred.reject(result);
                }
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    }, null);

    return deferred.promise;
}

/**
 * 重新支付
 * 重新发起一笔支付要使用原订单号，避免重复支付；
 * 已支付过或已调用关单、撤销（请见后文的API列表）的订单号不能重新发起支付。
 * @param request
 * @returns {*|promise|C}
 */
function repay(request) {
    const deferred = Q.defer();
    deferred.resolve(__WX_PAY_DATA__.constructWechatPayResult(request));
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
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__CLOSE_ORDER__, postData, function (rawData) {
        __WX_PAY_DATA__
            .parseReturnCloseOrder(rawData)       // 对返回结果进行解析【XML转JSON】
            .then(__WX_PAY_HELPER__.checkSign)      // 验证结果的正确性
            .then(function (result) {               // 确认无误后回传给 Controller
                if (result.return_code === 'SUCCESS' &&
                    result.result_code === 'SUCCESS'
                ) {
                    deferred.resolve(request);      // 透传参数
                }
                else {
                    deferred.reject(result);
                }
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    }, null);

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
    // 调用查询订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__ORDER_QUERY__, postData, function (rawData) {
        __WX_PAY_DATA__
            .parseReturnQueryOrder(rawData)       // 对返回结果进行解析【XML转JSON】
            .then(function (result) {             // 确认无误后回传给 Controller
                deferred.resolve(result);
            })
            .catch(function (err) {
                deferred.reject(err);
            });
    }, null);

    return deferred.promise;
}

function handlePayResultNotification(request) {
    return __WX_PAY_HELPER__.checkSign(request.body.xml);
}

/**
 * 处理退款结果通知
 * @param request
 * @returns {*|promise}
 */
function handleRefundResultNotification(request) {
    const deferred = Q.defer();

    try {
        if (request.body.xml.return_code === 'SUCCESS') {
            // 解密
            const info = __WX_PAY_HELPER__.decryptData(request.body.xml.req_info, 'AES-256-ECB', '');
            // 解析成JSON对象
            __WX_PAY_DATA__
                .parseRefundNotification(info)
                .then(function (result) {
                    __LOGGER__.debug(result);
                    deferred.resolve(result);
                });
        } else {
            deferred.reject(request.body.xml);
        }
    } catch (exception) {
        deferred.reject({
            return_code: __ERROR_CODE__.failed,
            return_msg: exception
        });
    }

    return deferred.promise;
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
    // 调用下载历史交易清单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__DOWNLOAD_BILL__, postData, function (result) {

    }, null);

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

    }, null);

    return deferred.promise;
}

/**
 *  申请退款
 *  当交易发生之后一段时间内，由于买家或者卖家的原因需要退款时，卖家可以通过退款接口将支付款退还给买家
 *  微信支付将在收到退款请求并且验证成功之后，按照退款规则将支付款按原路退到买家帐号上。
 *  注意：
 *  1、交易时间超过一年的订单无法提交退款
 *  2、微信支付退款支持单笔交易分多次退款，多次退款需要提交原支付订单的商户订单号和设置不同的退款单号。
 *      申请退款总金额不能超过订单金额。 一笔退款失败后重新提交，请不要更换退款单号，请使用原商户退款单号
 *  3、请求频率限制：150qps，即每秒钟正常的申请退款请求次数不超过150次
 *     错误或无效请求频率限制：6qps，即每秒钟异常或错误的退款申请请求不超过6次
 *  4、每个支付订单的部分退款次数不能超过50次
 *
 <xml>
 <return_code><![CDATA[SUCCESS]]></return_code>
 <return_msg><![CDATA[OK]]></return_msg>
 <appid><![CDATA[wxc91180e424549fbf]]></appid>
 <mch_id><![CDATA[1329741401]]></mch_id>
 <nonce_str><![CDATA[09NkUBiTskKRdUGy]]></nonce_str>
 <sign><![CDATA[1F20227358E889CC8A32F60D884C0BB7]]></sign>
 <result_code><![CDATA[SUCCESS]]></result_code>
 <transaction_id><![CDATA[4200000123201805193299564105]]></transaction_id>
 <out_trade_no><![CDATA[13297414012018051917224152133861]]></out_trade_no>
 <out_refund_no><![CDATA[undefined]]></out_refund_no>
 <refund_id><![CDATA[50000106982018052204736080847]]></refund_id>
 <refund_channel><![CDATA[]]></refund_channel>
 <refund_fee>1</refund_fee>
 <coupon_refund_fee>0</coupon_refund_fee>
 <total_fee>1</total_fee>
 <cash_fee>1</cash_fee>
 <coupon_refund_count>0</coupon_refund_count>
 <cash_refund_fee>1</cash_refund_fee>
 </xml>
 * @param request
 * @returns {*|promise}
 */
function Refund(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructRefundParams(request));
    __LOGGER__.debug(postData);
    const agentOptions = {
        pfx: __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..', '..'), 'credentials', 'wechat.pay', __WX_PAY_CONFIG__.__WECHAT_PAY_API_CLIENT_CERT__)),
        passphrase: __WX_PAY_CONFIG__.__MCH_ID__
    };
    // 调用申请退款API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__REFUND__, postData, function (rawData) {
        __LOGGER__.debug(rawData);
        __WX_PAY_DATA__
            .parseReturnRefund(rawData)             // 对返回结果进行解析【XML转JSON】
            .then(function (result) {              // 确认无误后回传给 Controller
                __LOGGER__.debug(result);
                deferred.resolve(result);
            })
            .catch(function (err) {
                __LOGGER__.error(err);
                deferred.reject(err);
            });
    }, agentOptions);

    return deferred.promise;
}

/**
 * 企业付款到银行卡
 *      用于企业向微信用户银行卡付款
 *      目前支持接口API的方式向指定微信用户的银行卡付款
 * 接口调用规则：
 * ◆ 单商户日限额——单日100w
 * ◆ 单次限额——单次5w
 * ◆ 单商户给同一银行卡单日限额——单日5w
 * @param request
 * @returns {*|C|promise}
 */
function payBank(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructPayBankParams(request));
    __LOGGER__.debug(postData);
    const agentOptions = {
        pfx: __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..', '..'), 'credentials', 'wechat.pay', __WX_PAY_CONFIG__.__WECHAT_PAY_API_CLIENT_CERT__)),
        passphrase: __WX_PAY_CONFIG__.__MCH_ID__
    };
    // 调用关闭订单API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__PAY_BANK__, postData, function (rawData) {
        __LOGGER__.debug(rawData);
        // __WX_PAY_DATA__
        //     .parseReturnRefund(rawData)             // 对返回结果进行解析【XML转JSON】
        //     .then(function (result) {              // 确认无误后回传给 Controller
        //         __LOGGER__.debug(result);
        //         deferred.resolve(result);
        //     })
        //     .catch(function (err) {
        //         __LOGGER__.error(err);
        //         deferred.reject(err);
        //     });
    }, agentOptions);

    return deferred.promise;
}

/**
 *      获取RSA加密公钥API
 *
 *      注意：
 *      请求需要双向证书
 *      接口默认输出PKCS#1格式的公钥，商户需根据自己开发的语言选择公钥格式
 *
 *      使用方式：
 *      1、 调用获取RSA公钥API获取RSA公钥，落地成本地文件，假设为public.pem
 *      2、 确定public.pem文件的存放路径，同时修改代码中文件的输入路径，加载RSA公钥
 *      3、 用标准的RSA加密库对敏感信息进行加密，选择RSA_PKCS1_OAEP_PADDING填充模式
 *      （eg：Java的填充方式要选 " RSA/ECB/OAEPWITHSHA-1ANDMGF1PADDING"）
 *      4、 得到进行rsa加密并转base64之后的密文
 *      5、 将密文传给微信侧相应字段，如付款接口（enc_bank_no/enc_true_name）
 *
 * @param request
 * @returns {*|C|promise}
 */
function getPublicKey(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_PAY_HELPER__.convertToXml(__WX_PAY_DATA__.constructGetPublicKeyParams(request));
    __LOGGER__.debug(postData);
    const agentOptions = {
        pfx: __FILE_SYSTEM__.readFileSync(__PATH__.join(__PATH__.resolve(__dirname, '..', '..'), 'credentials', 'wechat.pay', __WX_PAY_CONFIG__.__WECHAT_PAY_API_CLIENT_CERT__)),
        passphrase: __WX_PAY_CONFIG__.__MCH_ID__
    };
    // 调用获取RSA加密公钥API
    __HTTP_CLIENT__.doHttpsPost(__WX_PAY_API__.__GET_PUBLIC_KEY__, postData, function (rawData) {
        __LOGGER__.debug(rawData);
    }, agentOptions);

    return deferred.promise;
}

module.exports = {
    unifiedOrder: unifiedOrder,
    repay: repay,
    closeOrder: closeOrder,
    queryOrder: queryOrder,
    Refund: Refund,
    payBank: payBank,
    handlePayResultNotification: handlePayResultNotification,
    handleRefundResultNotification: handleRefundResultNotification
};

// submitRefund({
//     out_trade_no: '13297414012018051917224152133861',
//     // out_refund_no: '',
//     total_fee: 1,
//     refund_fee: 1
// });

// unifiedOrder({
//     body: '不需插电不需点燃，一键启动的日本VAPE电子蚊香 | 不需插电不需点燃，一键启动的日本VAPE电子蚊香 | ',
//     attach: 'attach',
//     total_fee: 1,
//     goods_tag: 'nice',
//     notify_url: 'http://www.baidu.com',
//     spbill_create_ip: '192.168.0.2',
//     // openid: 'osCkO0a1sPv2YDNBIAw7wFXlTib4'    //  莆素
//     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
// });

// closeOrder({
//     out_trade_no: '132974140120180506095421'
// });

// queryOrder({
//    out_trade_no: '132974140120180506104719'
// });

// downloadBill({});

//downloadFundFlow({});

// Refund({
//     out_trade_no: '13297414012018052214015068882433',
//     out_refund_no: '13297414012018052214115944426193',
//     total_fee: 1,
//     refund_fee: 1
// });

// payBank({});

// getPublicKey({});