const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __API__ = require('./wechat.mini.program.api');
const __CONFIG__ = require('./wechat.mini.program.config');

/**
 * 微信小程序
 *  请求参数
 *      参数          必填          说明
 *      appid           是    小程序唯一标识
 *      secret          是    小程序的 app secret
 *      js_code         是    登录时获取的 code
 *      grant_type      是    填写为 authorization_code
 *
 *  在不满足UnionID下发条件的情况下，返回参数
 *      参数                  说明
 *      openid              用户唯一标识
 *      session_key         会话密钥
 */
function fetchUserOpenId(code) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__API__.__API_OPENID__, __CONFIG__.__APP_ID_MINI_PROGRAM__, __CONFIG__.__APP_SECRET_MINI_PROGRAM__, code),
            function (rawData) {
                const data = JSON.parse(rawData);
                if (data.hasOwnProperty('openid')) {
                    deferred.resolve(data);
                } else {
                    deferred.reject(data);
                }
            });

    return deferred.promise;
}

module.exports = {
    fetchUserOpenId: fetchUserOpenId
};


