const Q = require('q');
const __SHA1__ = require('sha1');
const __UTIL__ = require('util');
const __PATH__ = require('path');
const __MOMENT__ = require('moment');
const __FILE_SYSTEM__ = require('fs');
const __CONFIG__ = require('./wechat.access_token.config');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.access_token.service.js');

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
            __UTIL__.format(__CONFIG__.__API_ACCESS_TOKEN__, __CONFIG__.__APP_ID__, __CONFIG__.__APP_SECRET__),
            function (rawData) {
                let token = JSON.parse(rawData);
                if (token.hasOwnProperty('expires_in')) {
                    //  计算过期时间
                    token.expires_in = Date.now() + (token.expires_in - 300) * 1000;
                    // __LOGGER__.debug(token.expires_in);
                    __LOGGER__.debug('AccessToken 将于以下时间后过期 ==> ' + __MOMENT__(new Date(token.expires_in)).format('YYYY-MM-DD HH:mm:ss'));
                    //  写入json文件
                    __FILE_SYSTEM__.writeFileSync(__PATH__.join(__dirname, 'wechat.access_token.json'), JSON.stringify(token));
                    deferred.resolve(token);
                } else {
                    deferred.reject(rawData);
                }
            }
        );

    return deferred.promise;
}

// requestAccessToken();

/**
 * 被动刷新access_token的接口
 * 这样便于业务服务器在API调用获知access_token已超时的情况下，可以触发access_token的刷新流程
 * @returns {*|promise|C}
 */
function accessToken() {
    const deferred = Q.defer();

    let token = JSON.parse(__FILE_SYSTEM__.readFileSync(__PATH__.join(__dirname, 'wechat.access_token.json')));
    if (token.expires_in < Date.now()) {
        requestAccessToken()
            .then(result => {
                deferred.resolve(result);
            })
            .catch(exception => {
                deferred.reject(exception);
            });
    } else {
        deferred.resolve(token);
    }

    return deferred.promise;
}

// accessToken().then(res => console.log(res));

/**
 *  获取 JASPI Ticket
 * @param request
 * @returns {*|C|promise}
 */
function requestJSAPITicket(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__CONFIG__.__API_JSAPI_TICKET__, request.access_token),
            function (rawData) {
                console.log(JSON.parse(rawData));
                deferred.resolve(JSON.parse(rawData));
            }
        );

    return deferred.promise;
}

/**
 *  获取 卡券 Ticket
 * @param request
 * @returns {*|C|promise}
 */
function requestCardAPITicket(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__CONFIG__.__API_CARD_TICKET__, request.access_token),
            function (rawData) {
                console.log(JSON.parse(rawData));
                deferred.resolve(JSON.parse(rawData));
            }
        );

    return deferred.promise;
}


/**
 * 随机字符串，由开发者设置传入，加强安全性（若不填写可能被重放请求）
 * 随机字符串，不长于 32 位
 * 推荐使用大小写字母和数字，不同添加请求的 nonce_str 须动态生成，若重复将会导致领取失败。
 * @param length
 * @returns {string}
 */
function getNonceStr(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const count = chars.length;
    let i, nonceStr = '';
    for (i = 0; i < length; i++) {
        nonceStr += chars.substr(Math.floor(Math.random() * (count - 1) + 1), 1);
    }
    return nonceStr;
}

/**
 *  按字典顺序排序后连接字符串
 * @param args
 * @returns {string}
 */
function concatSortArgs(args) {
    let values = Object.values(args);

    values = values.sort();
    let string = '';
    values.forEach(function (value) {
        string += value;
    });
    return string;
}

/**
 *  签名 -- SHA1算法
 * @param request
 * @returns {*|C|promise}
 */
function signature(request) {
    const deferred = Q.defer();

    const nonceStr = getNonceStr(32);               //  随机字符串
    const timestamp = __MOMENT__().format('X');     //  时间戳，东八区时间,UTC+8，单位为秒
    let sortString = concatSortArgs({
        openid: request.openid,
        api_ticket: request.ticket,
        timestamp: timestamp,
        nonce_str: nonceStr,
        card_id: request.card_id,
    });
    deferred.resolve({
        card_id: request.card_id,
        openid: request.openid,                 // 指定领取者的openid，只有该用户能领取。
        timestamp: timestamp,                   // 必填，生成签名的时间戳
        nonceStr: nonceStr,                     // 必填，生成签名的随机串
        signature: __SHA1__(sortString)         // 必填，签名，见附录1
    });

    return deferred.promise;
}

module.exports = {
    accessToken: accessToken,
    jsAPITicket: requestJSAPITicket,
    cardAPITicket: requestCardAPITicket,
    signature: signature
};

// requestAccessToken().then(res => __LOGGER__.debug(res));

// requestAccessToken()
//     .then(requestCardAPITicket)
//     .then(data => {
//         return Q({
//             openid: 'oX9I95fltsje2iLb0aQb-1W_NY1k',
//             card_id: 'pWWirwTXfRL0Wbz5MLnvmq75xeqY',
//             ticket: data.ticket
//         });
//     })
//     .then(signature)
//     .then(res => {
//         'use strict';
//         console.log(res);
//     });