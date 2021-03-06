const Q = require('q');
const __MOMENT__ = require('moment');
const __WX_OPEN_SERVICE__ = require('../services/wechat.open.platform/wechat.open.platform.service');
const __WX_OPEN_STRUCTURE__ = require('../services/wechat.open.platform/wechat.open.platform.structure');
const __WX_OPEN_HELPER__ = require('../services/wechat.open.platform/wechat.open.platform.helper');
const __WX_OFFICIAL_SERVICE__ = require('../services/wechat.official.account/wechat.official.account.service');
const __WX_WEBSITE_CONFIG__ = require('../services/wechat.website/wechat.website.config');
const __WX_WEBSITE_SERVICE__ = require('../services/wechat.website/wechat.website.service');
const __PLATFORM__ = require('../database/platform.api');
const __USER__ = require('../database/user.api');
const __USER_STATEMENT__ = require('../database/user.sql.statement');
const __LOGGER__ = require('../services/log4js.service').getLogger('platform.controller.js');

/**
 * 公众号或小程序授权成功
 * @param request
 * @returns {Promise.<TResult>}
 */
function authorizerLogin(request) {
    return __WX_OPEN_SERVICE__.componentVerifyTicket()
        .then(__WX_OPEN_SERVICE__.componentToken)
        .then(res => {
            // 获取component access token 结合用户的授权code
            // 向微信服务器获取授权方的信息
            res.authorization_code = request.authorizationCode;
            return Q(res);
        })
        .then(__WX_OPEN_SERVICE__.requestAuthorizerToken)
        .then(authorizerToken => {
            //  公众号授权给开发者的权限集列表
            let funcInfo = '';
            if (authorizerToken.authorization_info.func_info.length > 0) {
                authorizerToken.authorization_info.func_info.map(item => {
                    funcInfo += ',' + item.funcscope_category.id;
                });
                funcInfo = funcInfo.substr(1);
            }
            //  准备下记录返回token等信息
            return Q({
                appid: authorizerToken.authorization_info.authorizer_appid,
                accessToken: authorizerToken.authorization_info.authorizer_access_token,
                expiresIn: __MOMENT__(new Date(Date.now() + (authorizerToken.authorization_info.expires_in - 1800) * 1000)).format('YYYY-MM-DD HH:mm:ss'),
                refreshToken: authorizerToken.authorization_info.authorizer_refresh_token,
                funcInfo: funcInfo,
                type: request.type
            });
        })
        .then(__PLATFORM__.addAuthorizer);
}

/**
 * 公众号管理员扫描二维码授权给第三方平台
 * 主动通知后端保存授权信息
 * @param request
 * @param response
 */
function authorizerLoginWrapper(request, response) {
    authorizerLogin({
        authorizationCode: request.query.auth_code,
        type: 0         //  公众号
    })
        .then(authorizer => {
            authorizer.session = request.params.session;
            return Q(authorizer);
        })
        .then(__PLATFORM__.authorizerAndUser)
        .then(result => {
            __LOGGER__.debug(result);
            response('授权成功');
        })
        .catch(error => {
            __LOGGER__.error(error);
            response('该公众号已经绑定过');
        });
}

/**
 * 收到授权事件
 * 1. 微信每隔十分钟向服务商发送 Component Verify Ticket
 * 2. 自媒体或商家向服务商授权后收到的授权结果通知
 * 接收地址是 授权事件接收URL https://www.pusudo.cn/platform/license
 * @param request
 * @param response
 */
function receiveLicenseNotification(request, response) {
    __WX_OPEN_HELPER__
        .decryptMessage(
            request.query.msg_signature,
            request.query.timestamp,
            request.query.nonce,
            request.body.xml.encrypt
        )
        .then(__WX_OPEN_STRUCTURE__.parseLicenseMessage)
        .then(message => {
            __LOGGER__.debug(message);
            if (message.hasOwnProperty('infoType') && message.infoType === 'component_verify_ticket') {
                //  在第三方平台创建审核通过后，微信服务器会向其“授权事件接收URL”每隔10分钟定时推送component_verify_ticket
                return __WX_OPEN_SERVICE__.recordComponentVerifyTicket(message);
            } else if (message.hasOwnProperty('infoType') &&
                (message.infoType === 'updateauthorized' || message.infoType === 'authorized')) {
                //  当公众号对第三方平台进行授权、取消授权、更新授权后，微信服务器会向第三方平台方的授权事件接收URL
                // （创建第三方平台时填写）推送相关通知
                message.type = 0;               //  授权者类型： 公众号
                return authorizerLogin(message);
            }
        })
        .then(result => {
            __LOGGER__.debug(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
        })
        .finally(() => {
            response('success');
        });
}

/**
 * 代公众号实现网站授权
 * 用户通过服务商向自媒体或者商家授权后，收到的授权事件通知
 * 接收地址是 公众号开发域名 official.pusudo.cn
 * @param request
 * @param response
 */
function receiveAuthorizerCodeNotification(request, response) {
    if (request.query.hasOwnProperty('appid') && request.query.hasOwnProperty('code')) {
        __WX_OPEN_SERVICE__
            .componentVerifyTicket()
            .then(__WX_OPEN_SERVICE__.componentToken)
            .then(token => {
                return Q({
                    appid: request.query.appid,
                    code: request.query.code,
                    component_access_token: token.component_access_token
                });
            })
            .then(__WX_OPEN_SERVICE__.authorizerToUserAccessToken)
            .then(params => {
                return Q({
                    appid: request.query.appid,
                    accessToken: params.access_token,
                    expiresIn: __MOMENT__(new Date(Date.now() + (params.expires_in - 1800) * 1000)).format('YYYY-MM-DD HH:mm:ss'),
                    refreshToken: params.refresh_token,
                    openid: params.openid,
                    scope: params.scope
                });
            })
            .then(user => {
                user.role = __USER_STATEMENT__.__USER_TYPE__.OPEN_PLATFORM;
                __LOGGER__.debug(user);
                switch (user.scope) {
                    case 'snsapi_base':
                        __PLATFORM__
                            .wechatOpenPlatformLogin(user)
                            .then(result => {
                                __LOGGER__.debug(result);
                                response(result);
                            });
                        break;
                    case 'snsapi_userinfo':
                        __WX_OPEN_SERVICE__
                            .authorizerUserInfo(user)
                            .then(__USER__.saveWechatUserInfo)
                            .then(() => {
                                return Q(user);
                            })
                            .then(__PLATFORM__.wechatOpenPlatformLogin)
                            .then(result => {
                                __LOGGER__.debug(result);
                                response(result);
                            });
                        break;
                    default:
                        break;
                }

            })
            .catch(error => {
                __LOGGER__.error(error);
                response(error);
            });
    } else {
        response();
    }
}

/**
 * 用户授权登录开放平台下的网站时，收到的回调信息
 * @param request
 * @param response
 */
function receiveWechatLoginCodeNotification(request, response) {
    let user;
    let s;

    __WX_WEBSITE_SERVICE__
        .requestAccessToken({           //  通过 code 获取 access token
            code: request.query.code
        })
        .then(token => {
            user = token;
            user.expiresIn = __MOMENT__(new Date(Date.now() + (token.expires_in - 1800) * 1000)).format('YYYY-MM-DD HH:mm:ss');
            user.appid = __WX_WEBSITE_CONFIG__.__APP_ID_WEBSITE__;
            user.role = __USER_STATEMENT__.__USER_TYPE__.WEBSITE;
            return Q(user);
        })
        .then(__PLATFORM__.wechatOpenPlatformLogin)     //  记录微信登录
        .then(session => {
            s = session;
            return Q(user);
        })
        .then(__WX_WEBSITE_SERVICE__.requestUserInfo)   //  获取登录用户信息
        .then(__USER__.saveWechatUserInfo)              //  记录
        .then(result => {
            __LOGGER__.debug(result);
            response(s);                                //  返回session
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

/**
 * 获取授权方的access_token
 * 如果数据库上的token未过期，则直接返回
 * 已过期，重新获取，同时将结果记录在数据库上
 * @param request
 */
function fetchAuthorizerAccessToken(request) {
    const deferred = Q.defer();

    __PLATFORM__
        .fetchAuthorizerAccessToken(request)
        .then(result => {
            __LOGGER__.debug(result);
            if (result.code === 0 && result.msg.length > 0) {
                if (parseInt(__MOMENT__(result.msg[0].expiresIn).format('X')) < parseInt(__MOMENT__(new Date().getTime()).format('X'))) {
                    // 如果授权方的access token 已过期，尝试刷新access token
                    __WX_OPEN_SERVICE__
                        .componentVerifyTicket()
                        .then(__WX_OPEN_SERVICE__.componentToken)               //  获取component 的 access token
                        .then(componentToken => {
                            return Q({
                                authorizer_appid: result.msg[0].appid,
                                authorizer_refresh_token: result.msg[0].refreshToken,
                                component_access_token: componentToken.component_access_token
                            });
                        })
                        .then(__WX_OPEN_SERVICE__.refreshAuthorizerToken)       //  刷新授权方的 access token
                        .then(authorizerToken => {
                            return Q({
                                appid: result.msg[0].appid,
                                accessToken: authorizerToken.authorizer_access_token,
                                expiresIn: __MOMENT__(new Date(Date.now() + (authorizerToken.expires_in - 600) * 1000)).format('YYYY-MM-DD HH:mm:ss'),
                                refreshToken: authorizerToken.authorizer_refresh_token,
                                funcInfo: result.msg[0].funcInfo,
                                type: result.msg[0].type
                            });
                        })
                        .then(__PLATFORM__.addAuthorizer)   //  记录或者更新授权
                        .then(data => {
                            deferred.resolve(data);         //  返回刷新后的access token
                        })
                        .catch(error => {                   //  异常处理
                            __LOGGER__.error(error);
                            deferred.reject(error);
                        });
                } else {
                    deferred.resolve(result.msg[0]);        //  未过期，直接返回 access token
                }
            } else {
                deferred.reject('未获得授权');              //  查询返回数组为空
            }
        })
        .catch(error => {
            __LOGGER__.error(error);
            deferred.reject(error);
        });

    return deferred.promise;
}

/**
 * 获取授权方的基本信息
 * @param request
 * @param response
 */
function fetchAuthorizerInfo(request, response) {
    let authorizer_appid;

    __PLATFORM__
        .fetchAuthroizerInfo(request.query)
        .then(info => {
            __LOGGER__.debug(info);
            authorizer_appid = info.msg[0].appid;
            return Q({});
        })
        .then(__WX_OPEN_SERVICE__.componentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.componentToken)
        .then(token => {
            token.authorizer_appid = authorizer_appid;
            __LOGGER__.debug(token);
            return Q(token);
        })
        .then(__WX_OPEN_SERVICE__.getAuthorizerInfo)
        .then(result => {
            response(result);
        })
        .catch(err => {
            __LOGGER__.error(err);
            response(err);
        });
}

// fetchAuthorizerInfo({
//    query: {
//        session: '5LiyPDSsjROnkJ5uLD4DcvpP2Hw7vifU'
//    }
// }, () => {
// });

/**
 * 第三方授权页面链接
 *  --  微信公众号
 * @param request
 * @param response
 */
function fetchComponentLoginPageUrl(request, response) {
    __USER__
        .checkIdentity(request.query)
        .then(__WX_OPEN_SERVICE__.componentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.componentToken)
        .then(__WX_OPEN_SERVICE__.createPreAuthCode)
        .then(preAuthCode => {
            preAuthCode.session = request.query.session;
            preAuthCode.auth_type = request.query.auth_type
            return Q(preAuthCode);
        })
        .then(__WX_OPEN_SERVICE__.generateComponentLoginPageUrl)
        .then(url => {
            __LOGGER__.debug('COMPONENT LOGIN PAGE ==> ' + url);
            response(url);
        })
        .catch(err => {
            __LOGGER__.error(err);
            response(err);
        });
}

// fetchComponentLoginPageUrl({
//     query: {
//         session: 'fwAHYLNYOE8mjB5REuWtpp5MyBW9Wph9'
//     }
// }, () => {
// });

/**
 * 创建菜单
 * @param request
 * @param response
 */
function createMenu(request, response) {
    fetchAuthorizerAccessToken(request)
        .then(token => {
            __LOGGER__.debug(token);
            return Q({
                access_token: token.accessToken,
                menu: request.menu
            });
        })
        .then(__WX_OFFICIAL_SERVICE__.deleteMenu)
        .then(__WX_OFFICIAL_SERVICE__.createMenu)
        .then(result => {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

/**
 * 自定义菜单
 *  --  代授权方处理菜单
 * @param request
 */
function deleteMenu(request) {
    fetchAuthorizerAccessToken(request)
        .then(token => {
            __LOGGER__.debug(token);
            return Q({
                access_token: token.accessToken
            });
        })
        .then(__WX_OFFICIAL_SERVICE__.deleteMenu)
        .then(result => {
            __LOGGER__.debug(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
        });
}

/**
 *  获取快速注册小程序的链接
 * @param request
 * @param response
 */
function fetchRegisterMiniProgramUrl(request, response) {
    __USER__
        .checkIdentity(request.query)
        .then(() => {
            return Q(request.query);
        })
        .then(__WX_OPEN_SERVICE__.generateFastRegisterAuthUrl)
        .then(result => {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

/**
 * 快速注册小程序
 * @param request
 * @param response
 */
function fastRegisterMiniProgram(request, response) {
    fetchAuthorizerAccessToken(request.query)               //  获取授权公众号的access token
        .then(token => {
            return Q({
                ticket: request.query.ticket,               //  带上公众号扫码授权的凭证 ticket (公众平台扫码页面回跳到第三方平台时携带)
                access_token: token.accessToken
            });
        })
        .then(__WX_OPEN_SERVICE__.fastRegisterMiniProgram)  //  快速注册小程序
        .then(register => {
            return Q({
                authorizationCode: register.authorization_code,
                type: 1                                     //  类型： 小程序
            });
        })
        .then(authorizerLogin)                              //  使用appid及authorization_code换取authorizer_refresh_token
        .then(authorizer => {
            authorizer.session = request.query.session;
            return Q(authorizer);
        })
        .then(__PLATFORM__.authorizerAndUser)               //  将授权公众号的管理员与新注册的小程序相绑定
        .then(result => {
            __LOGGER__.debug(result);
            response('成功注册小程序');
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

/**
 * 获取复用公众号关联的小程序列表
 *
 * @param request
 * @param response
 */
function fetchMiniProgramList(request, response) {
    __PLATFORM__
        .fetchAuthroizerInfo(request.query)
        .then(info => {
            __LOGGER__.debug(info);
            let result = info.msg.map(item => {
                return {
                    appid: item.appid,
                    funcInfo: item.funcInfo
                };
            });
            response(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

/**
 * 获取帐号基本信息
 * @param request
 * @param response
 */
function fetchAccountBasicInfo(request, response) {
    fetchAuthorizerAccessToken(request.query)               //  利用appid获取小程序的access token
        .then(__WX_OPEN_SERVICE__.fetchAccountBasicInfo)    //  获取帐号基本信息
        .then(result => {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

module.exports = {
    receiveLicenseNotification: receiveLicenseNotification,
    receiveAuthorizerCodeNotification: receiveAuthorizerCodeNotification,
    receiveWechatLoginCodeNotification: receiveWechatLoginCodeNotification,
    fetchAuthorizerAccessToken: fetchAuthorizerAccessToken,
    fetchComponentLoginPageUrl: fetchComponentLoginPageUrl,
    fetchAuthorizerInfo: fetchAuthorizerInfo,
    authorizerLogin: authorizerLogin,
    authorizerLoginWrapper: authorizerLoginWrapper,
    createMenu: createMenu,
    fetchRegisterMiniProgramUrl: fetchRegisterMiniProgramUrl,
    fastRegisterMiniProgram: fastRegisterMiniProgram,
    fetchMiniProgramList: fetchMiniProgramList,
    fetchAccountBasicInfo: fetchAccountBasicInfo
};

// fetchAccountBasicInfo({
//     query: {
//         session: 'm3tejtflVeiWPElwgV8lotDIEcuF3hRe',
//         appid: 'wx42f5a0bb746d078f'
//     }
// }, () => {
// });

// fastRegisterMiniProgram({
//     query: {
//         session: 'I6fe4XqMIJFFwrbh14hg3VT5eiBIcmw7',
//         appid: 'wx7770629fee66dd93',
//         ticket: '70abd24118083c4e113cf937c382e7da'
//     }
// }, () => {
// });

// fetchRegisterMiniProgramUrl({
//     query: {
//         session: 'I6fe4XqMIJFFwrbh14hg3VT5eiBIcmw7',
//         appid: 'wx7770629fee66dd93'
//     }
// }, res => {
//     'use strict';
//     // console.log(res);
// });

// req = {
//     appid: 'wx90440dd971f71468',
//     menu: '%7B%22button%22%3A%5B%7B%22type%22%3A%22miniprogram%22%2C%22name%22%3A%22LINJINDI%22%2C%22url%22%3A%22http%3A%2F%2Fmp.weixin.qq.com%22%2C%22appid%22%3A%22wx0a72bd7d41e0b066%22%2C%22pagepath%22%3A%22pages%2Findex%2Findex%22%7D%5D%7D',
//     session: 'WKRZsT4nWNmjS2VGCO0Oy4GHnxZ7F0Dn'
// };
//
// console.log(JSON.parse(decodeURIComponent(req.menu)));
//
// createMenu({
//     session: req.session,
//     appid: req.appid,
//     menu: JSON.parse(decodeURIComponent(req.menu))
//
// }, function (request) {
//     __LOGGER__.info(request);
//     __LOGGER__.info('========================== END ==========================');
// });

// createMenu(
//     {
//         appid: 'wx7770629fee66dd93',
//         menu: {
//             'button': [
//                 {
//                     'type': 'miniprogram',
//                     'name': '经济指标',
//                     'url': 'http://mp.weixin.qq.com',
//                     'appid': 'wx0a72bd7d41e0b066',
//                     'pagepath': 'pages/index/index'
//                 }
//             ]
//         },
//         session: 'I6fe4XqMIJFFwrbh14hg3VT5eiBIcmw7'
//     },
//     () => {
//     }
// );

// deleteMenu(
//     {
//         appid: 'wx7770629fee66dd93'
//     }
// );

// fetchAuthorizerAccessToken({
//     appid: 'wx7770629fee66dd93'
// }).then(res => {
//     __LOGGER__.warn(res);
// });

// receiveAuthorizerCodeNotification({
//     query: {
//         code: '021NohB31ztu0O1AR4B313MrB31NohBE',
//         state: 'snsapi_userinfo',
//         appid: 'wx7770629fee66dd93'
//     }
// }, (session) => {
//     'use strict';
//     console.log(session);
// });

// { appId: 'wx4328d9d4893f7a2f',
//     createTime: 1533024535,
//     infoType: 'updateauthorized',
//     authorizerAppid: 'wx7770629fee66dd93',
//     authorizationCode:
//     'queryauthcode@@@amkk0vhHOe290Y89dnNEUeRgKvNzhe9hmf0cAJ_B7QHd4h0cdSkhD8IiOedp88XvO8WZd1cPeEsCrYRc4f7t4g',
//         authorizationCodeExpiredTime: '1533028135',
//     preAuthCode:
//     'preauthcode@@@RNaXpBjzVAKXZU0KPVV3CWBkH8NmL_qRVNv-X_kty-3p9XAz1xnGqXkbpfAGYc6S' }


//receiveLicenseNotification({
//    body: {
//        xml: {
//            appid: 'wx4328d9d4893f7a2f',
//            encrypt: 'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
//        }
//    },
//    query: {
//        signature: 'cf8da8d147285746176c3573e60bfaa057c622de',
//        timestamp: '1532675835',
//        nonce: '1418336492',
//        encrypt_type: 'aes',
//        msg_signature: 'f9d4b135c60bc9ac27b4e2742991a20709283078'
//    }
//}, () => {
//});

// receiveLicenseNotification({
//     body: {
//         xml: {
//             appid: 'wx4328d9d4893f7a2f',
//             encrypt: 'vu40uXA9SpYksKNKaUdij1pU5HuiAjSUnoZeTRnlnF4OxKJGD63wU1t27gSp4ObWJYCserb7L/KXNSCjWC7CX+1yiAMGvC2x0jKdouXHZjcbi2PIQesN+GzJwdrOAwTc4vhj+L0NoKrfSWJDqps6XP79sMBU4eNr3thEfN0AfOUufy4MQIzF64qFbfeQUaS4r6EAf5BSq877lZMX6MJaW+zKQK2kv4mNIn5w1yIRGtT+uAYdC02j/38eX8P97DmKqVz7qdZmtkXqGqeioFr2TrxYyqYbaHrTbKPo1WeoVkjXMa8aw+03DvxxWiOdfN+1/cPkqkn7uJ2sSUVUAwuAcLCrql9pb7m9N81iKPNIJAPZ0Yfj44N55DZo60BfoyHyQOCMCMJIzj4kpQSrLTEkW6mjrLKluVSpq+2HmQsJgLZN9ow/rxpsMpNg/8NeR3PKXGEAt4iaVIpofQndLoM7HdI6sChDPQBUrJw33HeJCfuBTITijwBNovUc2CO6a4XyPqdvPhJpZEzfxM9sFe5x9j0ISitM2szZ4GMa6mY6JCEKWijqZOQI1iY2cUO1O5AzoQKP1ywHffvAEeybq1YFHpOzC8ADjGoJDhCUu/sah+tAG+dGpwnashQRSC0mgli6HVJJhAOp955LuokLwW/BG8vGqlZRs76tcoFml+qBu+yAsx/vScxdmdLoWZL2hh3B6PCvqHgiQr9r0yiS4C12lF+CIeW8DVrYIJGpdVQV/8hVMHWghhEe7zBedL2dEhesRLr9czsMqydmGV3JDFUnUHRfFPtr+8cEB7spctZfZes='
//         }
//     },
//     query: {
//         signature: 'ac9c87ced177bd8e9f62e91b29e0399bc4502390',
//         timestamp: '1533083907',
//         nonce: '2062957577',
//         encrypt_type: 'aes',
//         msg_signature: '3e4c7d5b8ae629d8fa6deecffb2bfbde3f24bf6a'
//     }
// }, () => {
// });

//receiveWechatLoginCodeNotification({
//    query: {
//        code: '061XW7H21Z1b6P1SenF21WQoH21XW7HU'
//    }
//}, () => {
//});