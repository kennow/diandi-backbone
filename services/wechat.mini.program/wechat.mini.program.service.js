const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.mini.program.service.js');

/**
 * 微信小程序
 *  --  莆素
 *      --  AppID
 *      --  AppSecret
 *  -- openId 请求链接
 */
// const __APP_ID_MINI_PROGRAM__ = "wx0a72bd7d41e0b066";
// const __APP_SECRET_MINI_PROGRAM__ = "32e38063345fe06194fd59c970fde966";

/**
 * 微信小程序
 *  --  萌小娃
 *      --  AppID
 *      --  AppSecret
 *  -- openId 请求链接
 */
//const __APP_ID_MINI_PROGRAM__ = "wx552f609c3ae06a00";
//const __APP_SECRET_MINI_PROGRAM__ = "990271bddff2e955ff1a56a26fe25319";

/**
 * 微信小程序
 *  --  吃奶
 *      --  AppID
 *      --  AppSecret
 *  -- openId 请求链接
 */
const __APP_ID_MINI_PROGRAM__ = 'wxc91180e424549fbf';
const __APP_SECRET_MINI_PROGRAM__ = '881c0b6c654cc003104e23f3d930264e';

const __REQ_OPENID_API__ = 'https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code';

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
            __UTIL__.format(__REQ_OPENID_API__, __APP_ID_MINI_PROGRAM__, __APP_SECRET_MINI_PROGRAM__, code),
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


