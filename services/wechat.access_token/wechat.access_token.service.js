const Q = require('q');
const __UTIL__ = require('util');
const __CONFIG__ = require('./wechat.access_token.config');
const __HTTP_CLIENT__ = require('../http.client');
// const __LOGGER__ = require('../log4js.service').getLogger('wechat.access_token.service.js');

/**
 *      access_token是公众号的全局唯一接口调用凭据
 *
 *  公众号调用各接口时都需使用access_token。开发者需要进行妥善保存。
 *  access_token的存储至少要保留512个字符空间。
 *  access_token的有效期目前为2个小时，需定时刷新，重复获取将导致上次获取的access_token失效。
 *
 *  1. 建议公众号开发者使用中控服务器统一获取和刷新Access_token，
 *     其他业务逻辑服务器所使用的access_token均来自于该中控服务器，不应该各自去刷新，
 *     否则容易造成冲突，导致access_token覆盖而影响业务；
 *  2. 目前Access_token的有效期通过返回的expire_in来传达，目前是7200秒之内的值。
 *     中控服务器需要根据这个有效时间提前去刷新新access_token。在刷新过程中，中控服务器可对外继续输出的老access_token
 *     此时公众平台后台会保证在5分钟内，新老access_token都可用，这保证了第三方业务的平滑过渡。
 *  3. Access_token的有效时间可能会在未来有调整，所以中控服务器不仅需要内部定时主动刷新
 *     还需要提供被动刷新access_token的接口，这样便于业务服务器在API调用获知access_token已超时的情况下，可以触发access_token的刷新流程。
 *
 *  调用接口时，请登录“微信公众平台-开发-基本配置”提前将服务器IP地址添加到IP白名单中，点击查看设置方法，否则将无法调用成功。
 *  小程序无需配置IP白名单。
 */
function requestAccessToken() {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__CONFIG__.__API__, __CONFIG__.__APP_ID__, __CONFIG__.__APP_SECRET__),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            }
        );

    return deferred.promise;
}

module.exports = {
    accessToken: requestAccessToken
};

// requestAccessToken().then(res => __LOGGER__.debug(res));