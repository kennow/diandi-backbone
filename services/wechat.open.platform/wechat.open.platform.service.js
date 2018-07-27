const Q = require('q');
const __FILE_SYSTEM__ = require('fs');
const __PATH__ = require('path');
const __WX_OPEN_API__ = require('./wechat.open.platform.api');
const __WX_OPEN_STRUCTURE__ = require('./wechat.open.platform.structure');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.open.platform.service.js');

/**
 * 记录component_verify_ticket
 *
 * component_verify_ticket的有效时间较component_access_token更长
 * 建议保存最近可用的component_verify_ticket
 * 在component_access_token过期之前使用该ticket进行更新
 * 避免出现因为ticket接收失败而无法更新component_access_token的情况
 * @param request
 * @returns {*|C|promise}
 */
function recordComponentVerifyTicket(request) {
    const deferred = Q.defer();

    if(request.hasOwnProperty('infoType') && request.infoType === 'component_verify_ticket'){
        __FILE_SYSTEM__.writeFileSync(
            __PATH__.join(__dirname, 'component.verify.ticket.json'),
            JSON.stringify(request)
        )
    }
    deferred.resolve(request);  //  透传参数

    return deferred.promise;
}

function createPreAuthCode(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructCreatePreAuthCodeParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(__WX_OPEN_API__.__CREATE_PRE_AUTH_CODE__, postData, function (rawData) {
        __LOGGER__.debug(rawData);
    }, null);

    return deferred.promise;
}

module.exports = {
    recordComponentVerifyTicket:recordComponentVerifyTicket,
    createPreAuthCode: createPreAuthCode
};