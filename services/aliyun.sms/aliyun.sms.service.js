const Q = require('q');
const __QUERY_STRING__ = require('querystring');
const __CRYPTO__ = require('crypto');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('aliyun.sms.service.js');
const __CONFIG__ = require('./aliyun.sms.config');

/**
 * 签名算法
 * @param param
 * @returns {*}
 */
function sign(param) {
    let json = {}, p = Object.keys(param).sort();
    for (let i = 0; i < p.length; i++) {
        json[p[i]] = param[p[i]];
    }
    return __CRYPTO__
        .createHmac('sha1', param.AccessKeySecret + '&')
        .update(new Buffer('POST&' + encodeURIComponent('/') + '&' + encodeURIComponent(__QUERY_STRING__.stringify(json, '&', '=')), 'utf-8'))
        .digest('base64');
}

/**
 *  生成验证码
 * @param length
 * @returns {string}
 */
function generate(length) {
    let
        i,
        chars = '0123456789',
        verificationCode = '',
        count = chars.length - 1;

    for (i = 0; i < length; i++) {
        verificationCode = verificationCode.concat(chars.substr(parseInt(Math.random() * count), 1));
    }
    return verificationCode;
}

/**
 *  发送
 * @param request
 */
function trigger(request) {
    const deferred = Q.defer(),
        phone = request.phone,
        code = generate(__CONFIG__.KEY.__CODE_LENGTH__);
    let data = {
            SignName: __CONFIG__.KEY.__SMS_SIGN_NAME__,                         //   短信签名
            TemplateCode: __CONFIG__.KEY.__SMS_TEMPLATE_LOGIN__,                //   短信模板
            PhoneNumbers: phone,                                        //   接收短信的手机，逗号隔开，最多20个号码
            TemplateParam: JSON.stringify({                                     //   短信模板中参数指定
                code: code
            })
        },
        params;

    data.SignatureNonce = Math.random().toString();
    data.Timestamp = new Date().toISOString();
    params = Object.assign(data, __CONFIG__.PARAMS);
    params.Signature = sign(params);
    __HTTP_CLIENT__.doHttpPost(__CONFIG__.KEY.__PRODUCT_DOMAIN__, 80, params, function (rawData) {
        __LOGGER__.debug('========================== 收到短信发送结果 ==========================');
        const result = JSON.parse(rawData);
        deferred.resolve({
            requestId: result.RequestId,
            bizId: result.BizId,
            phone: phone,
            verificationCode: code,
            errCode: result.Code
        });
    });

    return deferred.promise;
}

module.exports = {
    trigger: trigger
};