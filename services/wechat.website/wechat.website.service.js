const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __API__ = require('./wechat.website.api');
const __CONFIG__ = require('./wechat.website.config');

/**
 * 请求CODE
 * 第三方使用网站应用授权登录前请注意已获取相应网页授权作用域（scope=snsapi_login），则可以通过在PC端打开以下链接：
 * 若提示“该链接无法访问”，请检查参数是否填写错误，如redirect_uri的域名与审核时填写的授权域名不一致或scope不为snsapi_login
 * 用户允许授权后，将会重定向到redirect_uri的网址上，并且带上code和state参数
 *      redirect_uri?code=CODE&state=STATE
 * 若用户禁止授权，则重定向后不会带上code参数，仅会带上state参数
 *      redirect_uri?state=STATE
 * @param request
 * @returns {*}
 */
function requestCode(request) {
    return __UTIL__.format(
        __API__.__CODE__,
        __CONFIG__.__APP_ID_WEBSITE__,
        encodeURIComponent('https://www.pusudo.cn/platform/website'),
        'snsapi_login',
        'GO'
    )
}

/**
 * 通过code获取access_token
 *
 * @param request
 * @returns {*}
 */
function requestAccessToken(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__API__.__ACCESS_TOKEN__,
            __CONFIG__.__APP_ID_WEBSITE__,
            __CONFIG__.__APP_SECRET_WEBSITE__,
            request.code),
        function (rawData) {
            let token = JSON.parse(rawData);
            if (token.hasOwnProperty('errcode')) {
                deferred.reject(token.errmsg);
            } else {
                deferred.resolve(token);
            }
        });

    return deferred.promise;
}

/**
 * 刷新access_token有效期
 *
 * access_token是调用授权关系接口的调用凭证，由于access_token有效期（目前为2个小时）较短，当access_token超时后，可以使用refresh_token进行刷新
 *
 * access_token刷新结果有两种：
 * 1. 若access_token已超时，那么进行refresh_token会获取一个新的access_token，新的超时时间；
 * 2. 若access_token未超时，那么进行refresh_token不会改变access_token，但超时时间会刷新，相当于续期access_token。
 *
 * refresh_token拥有较长的有效期（30天），当refresh_token失效的后，需要用户重新授权。
 * @param request
 * @returns {*}
 */
function refreshAccessToken(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__API__.__REFRESH_TOKEN__,
            __CONFIG__.__APP_ID_WEBSITE__,
            request.refreshToken),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        });

    return deferred.promise;
}

function requestUserInfo(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__API__.__USER_INFO__,
            request.access_token,
            request.openid),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        });

    return deferred.promise;
}

module.exports = {
    requestAccessToken: requestAccessToken,
    refreshAccessToken: refreshAccessToken,
    requestUserInfo: requestUserInfo
}

//console.log(requestCode({}));

//requestAccessToken({
//    code: '061Hfuob0Q9Ksu15pfob0Rzwob0HfuoK'
//}).then(result => {
//    console.log(result)
//});

//{ access_token: '12_8FuASspHOiS9Z0oou-dvt6iMTYpo8hBJBj-V_dP9wA5JQj5osXdDzIU4VBDMM0eJE2J-NxA0mgmU0DAmYzhK9A',
//    expires_in: 7200,
//    refresh_token: '12_-UMNdSfDKFCHZQw4qcgHRpuMPPIe8VHV6sUHpufPoyvGFLCVAlVttlX3iMJEpiRTGBVo1yZ7UvxKlh5Zhj45yw',
//    openid: 'ofGnF0_OMOIwp64nLoX2QYISId8M',
//    scope: 'snsapi_login',
//    unionid: 'owi_Y0cwiVxbOajv8bXJwitnxg-s' }

//refreshAccessToken({
//    refreshToken: '12_-UMNdSfDKFCHZQw4qcgHRpuMPPIe8VHV6sUHpufPoyvGFLCVAlVttlX3iMJEpiRTGBVo1yZ7UvxKlh5Zhj45yw'
//}).then(result => {
//    console.log(result)
//});

//{ openid: 'ofGnF0_OMOIwp64nLoX2QYISId8M',
//    access_token: '12_8FuASspHOiS9Z0oou-dvt6iMTYpo8hBJBj-V_dP9wA5JQj5osXdDzIU4VBDMM0eJE2J-NxA0mgmU0DAmYzhK9A',
//    expires_in: 7200,
//    refresh_token: '12_-UMNdSfDKFCHZQw4qcgHRpuMPPIe8VHV6sUHpufPoyvGFLCVAlVttlX3iMJEpiRTGBVo1yZ7UvxKlh5Zhj45yw',
//    scope: 'snsapi_base,snsapi_login,' }

//requestAccessToken({
//    code: '0815XIK82FQtZR01NmI82zBqK825XIKt'
//})
//    .then(requestUserInfo)
//    .then(result => {
//        console.log(result)
//    }).catch(error => {
//    console.error(error);
//});

//{ openid: 'ofGnF0_OMOIwp64nLoX2QYISId8M',
//    nickname: '李云鹏',
//    sex: 1,
//    language: 'zh_CN',
//    city: 'Gold Coast',
//    province: 'Queensland',
//    country: 'AU',
//    headimgurl: 'http://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83eohoiasD9v5My23otyGMM4IvsuxIvX5Ooa2HIdKIcicFzTGqTfaldwOv4icdrLTmpVJlX16sALuZSSIw/132',
//    privilege: [],
//    unionid: 'owi_Y0cwiVxbOajv8bXJwitnxg-s' }