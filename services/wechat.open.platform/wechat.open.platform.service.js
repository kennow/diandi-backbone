const Q = require('q');
const __FILE_SYSTEM__ = require('fs');
const __UTIL__ = require('util');
const __PATH__ = require('path');
const __MOMENT__ = require('moment');
const __WX_OPEN_API__ = require('./wechat.open.platform.api');
const __WX_OPEN_CONFIG__ = require('./wechat.open.platform.config');
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

    __FILE_SYSTEM__.writeFileSync(
        __PATH__.join(__dirname, 'component.verify.ticket.json'),
        JSON.stringify(request)
    );
    deferred.resolve(request);  //  透传参数

    return deferred.promise;
}

function componentVerifyTicket() {
    return Q(JSON.parse(__FILE_SYSTEM__.readFileSync(
        __PATH__.join(__dirname, 'component.verify.ticket.json')
    )));
}

//componentVerifyTicket().then(res => {console.log(res)});

/**
 * 获取第三方平台component_access_token
 *
 * 第三方平台通过自己的component_appid（即在微信开放平台管理中心的第三方平台详情页中的AppID和AppSecret）
 * 和component_appsecret，以及component_verify_ticket（每10分钟推送一次的安全ticket）
 * 来获取自己的接口调用凭据（component_access_token）
 * @param request
 * @returns {*}
 */
function requestComponentToken(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructComponentTokenParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(__WX_OPEN_API__.__GET_COMPONENT_TOKEN__, postData, function (rawData) {
        __LOGGER__.debug(rawData);
        let token = JSON.parse(rawData);
        if (token.hasOwnProperty('expires_in')) {
            //  计算过期时间
            token.expires_in = Date.now() + (token.expires_in - 1800) * 1000;
            // __LOGGER__.debug(token.expires_in);
            __LOGGER__.debug('Component Access Token 将于以下时间后过期 ==> ' + __MOMENT__(new Date(token.expires_in)).format('YYYY-MM-DD HH:mm:ss'));
            //  写入json文件
            __FILE_SYSTEM__.writeFileSync(__PATH__.join(__dirname, 'component.access.token.json'), JSON.stringify(token));
            deferred.resolve(token);
        } else {
            deferred.reject(rawData);
        }
    }, null);

    return deferred.promise;
}

/**
 * 如果记录在本地的token未超时，直接返回
 * 否则，重新发起token的获取流程
 *
 * @param request
 * @returns {*}
 */
function componentToken(request) {
    const deferred = Q.defer();
    let isTokenFileAvailable = false;
    let token;

    if (__FILE_SYSTEM__.existsSync(__PATH__.join(__dirname, 'component.access.token.json'))) {
        token = JSON.parse(__FILE_SYSTEM__.readFileSync(__PATH__.join(__dirname, 'component.access.token.json')));
        if (token.hasOwnProperty('expires_in') && token.hasOwnProperty('component_access_token')) {
            __LOGGER__.debug('过期时间：' + __MOMENT__(token.expires_in).format('YYYY-MM-DD HH:mm:ss'));
            __LOGGER__.debug('请求时间：' + __MOMENT__(Date.now()).format('YYYY-MM-DD HH:mm:ss'));
            isTokenFileAvailable = true;
        }
    }

    if (!isTokenFileAvailable || token.expires_in < Date.now()) {
        requestComponentToken(request)
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

/**
 * 获取预授权码pre_auth_code
 *
 * 第三方平台通过自己的接口调用凭据（component_access_token）来获取用于授权流程准备的预授权码（pre_auth_code）
 * @param request
 * @returns {*}
 */
function createPreAuthCode(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructPreAuthCodeParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__CREATE_PRE_AUTH_CODE__, request.component_access_token),
        postData,
        function (rawData) {
            let preAuthCode = JSON.parse(rawData);
            if (preAuthCode.hasOwnProperty('errcode')) {
                deferred.reject(preAuthCode.errmsg);
            } else {
                deferred.resolve({
                    component_access_token: request.component_access_token,
                    pre_authorization_code: preAuthCode.pre_auth_code
                });
            }

        }, null);

    return deferred.promise;
}

/**
 * 该API用于使用授权码换取授权公众号或小程序的授权信息
 * 并换取authorizer_access_token和authorizer_refresh_token
 *
 * 结果参数说明
 * authorization_info        授权信息
 * authorizer_appid            授权方appid
 * authorizer_access_token    授权方接口调用凭据（在授权的公众号或小程序具备API权限时，才有此返回值），也简称为令牌
 * expires_in                有效期（在授权的公众号或小程序具备API权限时，才有此返回值）
 * authorizer_refresh_token    接口调用凭据刷新令牌（在授权的公众号具备API权限时，才有此返回值）
 *                          刷新令牌主要用于第三方平台获取和刷新已授权用户的access_token，只会在授权时刻提供，请妥善保存。
 *                          一旦丢失，只能让用户重新授权，才能再次拿到新的刷新令牌
 * func_info                授权给开发者的权限集列表，ID为1到26分别代表：
 *                          1、消息管理权限 2、用户管理权限 3、帐号服务权限 4、网页服务权限 5、微信小店权限 6、微信多客服权限
 *                          7、群发与通知权限 8、微信卡券权限 9、微信扫一扫权限 10、微信连WIFI权限 11、素材管理权限 12、微信摇周边权限
 *                          13、微信门店权限 14、微信支付权限 15、自定义菜单权限 16、获取认证状态及信息 17、帐号管理权限（小程序）
 *                          18、开发管理与数据分析权限（小程序） 19、客服消息管理权限（小程序） 20、微信登录权限（小程序）
 *                          21、数据分析权限（小程序） 22、城市服务接口权限 23、广告管理权限 24、开放平台帐号管理权限
 *                          25、 开放平台帐号管理权限（小程序） 26、微信电子发票权限
 *                          请注意： 1）该字段的返回不会考虑公众号是否具备该权限集的权限（因为可能部分具备），请根据公众号的帐号类型和认证情况，来判断公众号的接口权限。
 *
 * @param request
 * @returns {*}
 */
function requestAuthorizerToken(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructAuthorizationParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__QUERY_AUTHORIZATION__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
            deferred.resolve(JSON.parse(rawData));
        }, null);

    return deferred.promise;
}

/**
 * 获取（刷新）授权公众号或小程序的接口调用凭据（令牌）
 *
 * 该API用于在授权方令牌（authorizer_access_token）失效时，可用刷新令牌（authorizer_refresh_token）获取新的令牌。
 * 请注意，此处token是2小时刷新一次，开发者需要自行进行token的缓存，避免token的获取次数达到每日的限定额度。
 * @param request
 * @returns {*}
 */
function refreshAuthorizerToken(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructRefreshAuthorizerToken(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__REFRESH_AUTHORIZER_TOKEN__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
            deferred.resolve(JSON.parse(rawData));
        }, null);

    return deferred.promise;
}

/**
 * 获取授权方的帐号基本信息
 *该API用于获取授权方的基本信息，包括头像、昵称、帐号类型、认证类型、微信号、原始ID和二维码图片URL。
 * @param request
 * @returns {*}
 */
function getAuthorizerInfo(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructAuthorizerInfoParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__GET_AUTHORIZER_INFO__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
        }, null);

    return deferred.promise;
}

/**
 * 获取授权方的选项设置信息
 * 该API用于获取授权方的公众号或小程序的选项设置信息，
 * 如：地理位置上报，语音识别开关，多客服开关。注意，获取各项选项设置信息，需要有授权方的授权，详见权限集说明。
 * @param request
 * @returns {*}
 */
function getAuthorizerOption(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructGetAuthorizerOptionParams(request);
    __LOGGER__.debug(postData);

    // 调用获取预授权码API
    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__GET_AUTHORIZER_OPTION__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
        }, null);

    return deferred.promise;
}

/**
 * 设置授权方的选项信息
 * 该API用于设置授权方的公众号或小程序的选项信息，
 * 如：地理位置上报，语音识别开关，多客服开关。注意，设置各项选项设置信息，需要有授权方的授权，详见权限集说明。
 * @param request
 * @returns {*}
 */
function setAuthorizerOption(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructSetAuthorizerOptionParams(request);
    __LOGGER__.debug(postData);

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__SET_AUTHORIZER_OPTION__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
        }, null);

    return deferred.promise;
}

/**
 * 第三方平台对其所有API调用次数清零（只与第三方平台相关，与公众号无关，接口如api_component_token）
 *
 * 请注意：
 * 1、每个公众号每个月有10次清零机会，包括在微信公众平台上的清零以及调用API进行清零
 * 2、第三方代公众号调用，实际上消耗的是公众号的清零quota
 * @param request
 * @returns {*}
 */
function clearComponentQuota(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructClearComponentQuotaParams(request);
    __LOGGER__.debug(postData);

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__CLEAR_QUOTA__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
        }, null);

    return deferred.promise;
}

/**
 * 生成获取授权公众号的CODE请求链接
 *
 * 在确保微信公众账号拥有授权作用域（scope参数）的权限的前提下
 * （一般而言，已微信认证的服务号拥有snsapi_base和snsapi_userinfo）
 * 使用微信客户端打开以下链接（严格按照以下格式，包括顺序和大小写，并请将参数替换为实际内容）
 *
 * 用户允许授权后，将会重定向到redirect_uri的网址上，并且带上code, state以及appid
 *
 * @param request
 * @returns {*}
 */
function userToAuthorizerCode(request) {
    return __UTIL__.format(__WX_OPEN_API__.__CODE__,
        request.appid,
        'http://official.pusudo.cn',
        // 'snsapi_userinfo',
        // 'snsapi_userinfo',
        'snsapi_base',
        'snsapi_base',
        __WX_OPEN_CONFIG__.__APP_ID__);
}

// console.log(userToAuthorizerCode({appid: 'wx7770629fee66dd93'}));

/**
 * 通过code换取access_token
 * @param request
 * @returns {*|promise|C}
 */
function authorizerToUserAccessToken(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__WX_OPEN_API__.__ACCESS_TOKEN__,
            request.appid,
            request.code,
            __WX_OPEN_CONFIG__.__APP_ID__,
            request.component_access_token),
        function (rawData) {
            let code = JSON.parse(rawData);
            if (code.hasOwnProperty('errcode')) {
                deferred.reject(code.errmsg);
            } else {
                deferred.resolve(code);
            }
        });

    return deferred.promise;
}

/**
 * 刷新access_token（如果需要）
 * 由于access_token拥有较短的有效期，当access_token超时后，可以使用refresh_token进行刷新，refresh_token拥有较长的有效期（30天）
 * 当refresh_token失效的后，需要用户重新授权
 * @param request
 * @returns {*|promise|C}
 */
function refreshAuthorizerToUserAccessToken(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__WX_OPEN_API__.__REFRESH_TOKEN__,
            request.appid,
            __WX_OPEN_CONFIG__.__APP_ID__,
            request.component_access_token,
            request.refreshToken
        ),
        function (rawData) {
            let code = JSON.parse(rawData);
            if (code.hasOwnProperty('errcode')) {
                deferred.reject(code.errmsg);
            } else {
                deferred.resolve(code);
            }
        });

    return deferred.promise;
}

/**
 * 通过网页授权access_token获取用户基本信息（需授权作用域为snsapi_userinfo）
 * @param request
 * @returns {*|promise|C}
 */
function authorizerUserInfo(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsGet(
        __UTIL__.format(__WX_OPEN_API__.__USER_INFO__,
            request.accessToken,
            request.openid),
        function (rawData) {
            let userInfo = JSON.parse(rawData);
            if (userInfo.hasOwnProperty('errcode')) {
                deferred.reject(userInfo.errmsg);
            } else {
                deferred.resolve(userInfo);
            }
        });

    return deferred.promise;
}

/**
 * 拉取当前所有已授权的帐号基本信息
 * @param request
 * @returns {*|promise|C}
 */
function getAuthorizerList(request) {
    const deferred = Q.defer();

    // 生成POST Data
    const postData = __WX_OPEN_STRUCTURE__.constructGetAuthorizerListParams(request);
    __LOGGER__.debug(postData);

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__WX_OPEN_API__.__GET_AUTHORIZER_LIST__, request.component_access_token),
        postData,
        function (rawData) {
            __LOGGER__.debug(rawData);
        }, null);

    return deferred.promise;
}

module.exports = {
    recordComponentVerifyTicket: recordComponentVerifyTicket,
    componentVerifyTicket: componentVerifyTicket,
    componentToken: componentToken,
    createPreAuthCode: createPreAuthCode,
    requestAuthorizerToken: requestAuthorizerToken,
    refreshAuthorizerToken: refreshAuthorizerToken,
    authorizerToUserAccessToken: authorizerToUserAccessToken,
    refreshAuthorizerToUserAccessToken: refreshAuthorizerToUserAccessToken,
    authorizerUserInfo: authorizerUserInfo
};

//componentVerifyTicket()
//    .then(componentToken)
//    .then(res => {
//        res.authorizer_appid = 'wx7770629fee66dd93';
//        __LOGGER__.debug(res);
//        return Q(res);
//    })
//    .then(getAuthorizerInfo)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });

//{"authorizer_info":{"nick_name":"莆素","head_img":"http:\/\/wx.qlogo.cn\/mmopen\/ibicDQQkq5lsLCGvqIsSua4ialcvyiciaTcIzeQiafOn5ibmDdFNEJbGTFOWZ0kgTZ1X25zhmekrpOTgt1em7NasiaHlbiclLhNiaUtfMY\/0","service_type_info":{"id":2},"verify_type_info":{"id":0},"user_name":"gh_23cc8c3098d7","alias":"flower_is_coming","qrcode_url":"http:\/\/mmbiz.qpic.cn\/mmbiz\/HrLxxsficia2NicdDphuLYhI3pcq5wH2pLFLtpZq4xriaanrvr5kuNQww4KHibJWcBzpYJIXR1FX3OopvcKHAryKaBw\/0","business_info":{"open_pay":1,"open_shake":0,"open_scan":0,"open_card":1,"open_store":1},"idc":1,"principal_name":"莆田市花管家电子商务有限公司","signature":"每周订购一束花，为生活做一点不经意的改变！"},"authorization_info":{"authorizer_appid":"wx7770629fee66dd93","authorizer_refresh_token":"","func_info":[{"funcscope_category":{"id":1}},{"funcscope_category":{"id":15}},{"funcscope_category":{"id":4}},{"funcscope_category":{"id":7}},{"funcscope_category":{"id":2}},{"funcscope_category":{"id":11}},{"funcscope_category":{"id":8}}]}}

//componentVerifyTicket()
//    .then(componentToken)
//    .then(res => {
//        res.authorizer_appid = 'wx7770629fee66dd93';
//        res.option_name = 'voice_recognize';
//        res.option_value = 0;
//        __LOGGER__.debug(res);
//        return Q(res);
//    })
//    .then(getAuthorizerOption)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });

// componentVerifyTicket()
//     .then(componentToken)
//     .then(createPreAuthCode)
//     .then(res => {
//         __LOGGER__.debug(res);
//         __LOGGER__.debug(__UTIL__.format(
//             __WX_OPEN_API__.__BIND_COMPONENT__,
//             3,
//             __WX_OPEN_CONFIG__.__APP_ID__,
//             res.pre_authorization_code,
//             'http://www.pusudo.cn',
//             // 'wx1133464776a7a161'
//             'wx7770629fee66dd93'
//         ));
//     })
//     .catch(err => {
//         __LOGGER__.error(err);
//     });

//componentVerifyTicket()
//    .then(componentToken)
//    .then(res => {
//        res.authorization_code = 'queryauthcode@@@QyJuSZ-WME5AYMqrgRalfHGvoGK6v9097NTl-Y_RYpmDGZhbugtJQSdgttJQnof47iFTFnqd3-QwZY0NmkHw6g';
//        __LOGGER__.debug(res);
//        return Q(res);
//    })
//    .then(requestAuthorizerToken)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });

// {"authorization_info":{"authorizer_appid":"wx7770629fee66dd93","authorizer_access_token":"12_hL7hOOWgzAmmN0hP7NB_0CE9YT-2wpgXBORSxyjk4gXSB-pGKPpvL51lcYYxRJtwZLjRMVZI-BUnXoYSaUxRMyeQ9zMtq9FKvDWBLG33ALgtZtvZxpXCzVqOhT62kr_f_-1I8BaHLcdnfG-UOLSeAJDGDK","expires_in":7200,"authorizer_refresh_token":"refreshtoken@@@dEtl-kzf3yQv5oz7jkWJBcv0OguoRuoEv-3Fvqe1FSY","func_info":[{"funcscope_category":{"id":1}},{"funcscope_category":{"id":15}},{"funcscope_category":{"id":4}},{"funcscope_category":{"id":2}},{"funcscope_category":{"id":11}},{"funcscope_category":{"id":8}}]}}

//componentVerifyTicket()
//    .then(componentToken)
//    .then(res => {
//        res.authorizer_appid = 'wx7770629fee66dd93';
//        res.authorizer_refresh_token = 'refreshtoken@@@dEtl-kzf3yQv5oz7jkWJBcv0OguoRuoEv-3Fvqe1FSY';
//        __LOGGER__.debug(res);
//        return Q(res);
//    })
//    .then(refreshAuthorizerToken)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });

//componentVerifyTicket()
//    .then(componentToken)
//    .then(clearComponentQuota)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });

// componentVerifyTicket()
//    .then(componentToken)
//    .then(getAuthorizerList)
//    .then(res => {
//        __LOGGER__.debug(res);
//    });
