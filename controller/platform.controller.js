const Q = require('q');
const __MOMENT__ = require('moment');
const __WX_OPEN_SERVICE__ = require('../services/wechat.open.platform/wechat.open.platform.service');
const __WX_OPEN_STRUCTURE__ = require('../services/wechat.open.platform/wechat.open.platform.structure');
const __WX_OPEN_HELPER__ = require('../services/wechat.open.platform/wechat.open.platform.helper');
const __PLATFORM__ = require('../database/platform.api');
const __USER__ = require('../database/user.api');
const __LOGGER__ = require('../services/log4js.service').getLogger('platform.controller.js');

/**
 * 收到授权事件
 * 1. 微信每隔十分钟向服务商发送 Component Verify Ticket
 * 2. 自媒体或商家向服务商授权后收到的授权结果通知
 * 接收地址是 授权事件接收URL https://www.pusudo.cn/platform/license
 * @param request
 * @param response
 */
function receiveAuthorizationNotification(request, response) {
    __WX_OPEN_HELPER__
        .decryptMessage(
            request.query.msg_signature,
            request.query.timestamp,
            request.query.nonce,
            request.body.xml.encrypt
        )
        .then(__WX_OPEN_STRUCTURE__.parseComponentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.recordComponentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.recordAuthorizationCode)
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
        .then(__WX_OPEN_SERVICE__.authorizerAccessToken)
        .then(params => {
            __LOGGER__.debug(params);
            return Q({
                appid: request.query.appid,
                accessToken: params.access_token,
                expiresIn: __MOMENT__(new Date(Date.now() + (params.expires_in - 600) * 1000)).format('YYYY-MM-DD HH:mm:ss'),
                refreshToken: params.refresh_token,
                openid: params.openid,
                scope: params.scope
            });
        })
        .then(__PLATFORM__.addAuthorizer)
        .then(user => {
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
        });
}

/**
 * 获取授权方的access_token
 * @param request
 * @param response
 */
function fetchAuthorizerAccessToken(request, response) {
    __PLATFORM__
        .fetchAuthorizerAccessToken(request)
        .then(result => {
            __LOGGER__.debug(result);
            if (result.code === 0 && result.msg.length > 0) {
                if (parseInt(__MOMENT__(result.msg[0].expiresIn).format('X')) < parseInt(__MOMENT__(new Date().getTime()).format('X'))) {
                    // 如果授权方的access token 已过期，尝试刷新access token
                    // TODO: 如果refresh token 也过期，应提示用户重新登录
                    __WX_OPEN_SERVICE__
                        .componentVerifyTicket()
                        .then(__WX_OPEN_SERVICE__.componentToken)                   //  获取component 的 access token
                        .then(componentToken => {
                            return Q({
                                appid: result.msg[0].appid,
                                component_access_token: componentToken.component_access_token,
                                refreshToken: result.msg[0].refreshToken
                            });
                        })
                        .then(__WX_OPEN_SERVICE__.refreshAuthorizerAccessToken)     //  刷新授权方的 access token
                        .then(authorizerToken => {
                            return Q({
                                appid: result.msg[0].appid,
                                accessToken: authorizerToken.access_token,
                                expiresIn: __MOMENT__(new Date(Date.now() + (authorizerToken.expires_in - 600) * 1000)).format('YYYY-MM-DD HH:mm:ss'),
                                refreshToken: authorizerToken.refresh_token,
                                openid: authorizerToken.openid,
                                scope: authorizerToken.scope
                            });
                        })
                        .then(__PLATFORM__.addAuthorizer)   //  记录或者更新授权
                        .then(data => {
                            response(data);     //  返回刷新后的access token
                        })
                        .catch(error => {
                            __LOGGER__.error(error);
                            response(error);
                        });
                } else {
                    //  未过期，直接返回 access token
                    response(result.msg[0]);
                }
            } else {
                response('未获得授权');      //  查询返回数组为空
            }
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error);
        });
}

module.exports = {
    receiveAuthorizationNotification: receiveAuthorizationNotification,
    receiveAuthorizerCodeNotification: receiveAuthorizerCodeNotification,
    fetchAuthorizerAccessToken: fetchAuthorizerAccessToken
};

// fetchAuthorizerAccessToken({
//     appid: 'wx7770629fee66dd93'
// }, (result) => {
//     'use strict';
//     __LOGGER__.warn(result);
// });

// receiveAuthorizerCodeNotification({
//     query: {
//         code: '011sBWMO1ZWpC11ShqLO1MkeNO1sBWMW',
//         state: 'snsapi_userinfo',
//         appid: 'wx7770629fee66dd93'
//     }
// }, (session) => {
//     'use strict';
//     console.log(session);
// });

//receiveAuthorizationNotification({
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

//receiveAuthorizationNotification({
//    body: {
//        xml: {
//            appid: 'wx4328d9d4893f7a2f',
//            encrypt: 'lRbeiMGknSn7wm8P9jojunfd9T1EttIItHSVqkX7ET1dfMGEy6hbaWDQgyBdk/tAYXPcjHoiXe+VrpNDGIS95FGSJF8h3CUpse45zwPzF5Xd00MpdkAEVueZaRWWVnn8oDqWLxEBtZhm3Pma/eHIdtZi9ybXtVg5a+BwKrxvjr1051eenKuUdwyBAfKDMyeIz6qBezQoO/p/C6I5k4i4AXRLNO679ZDmhyinUeCAC8pAmhkanPA2lpUKOQL2H5a+ELpzE4oLUvMKRBzVZsoDEG8qzCE4L2HsiFy8yy0l7xbOWCQJEYvV2nluTj3qfAKjwJfqHaR52KK2QmMtt7hRrKoUVz36w5kUgUfSyrlRFEtS9/Is10SADcjOJpWbYMlJWg9WChrEE+/BCB0hCRgaJH338VFa/ibVB/My9K8gRFsTSmwuK9Lr5bkO+C6gVmTbf+GGxCf512rqBzIc9SDyrE+ULhtJLZc3WWvhx6Tik0m3aWYAjh9Aey2C1oiftbxBKQe7FIsAqD9BS6QdnPChRpvvX7hZHbZxGEHmP0XZ66QIZ+YT9tAUlWBxQboEKA1+86OGzRLxj+NZdRRnCnup9DE1c7SwAjdcG/cQ5cm6+PXyd0j8Zpa2qlG7/l3WnDVQo41jP0cmmWNHtbl9hlDIe8nloOHSpdhO/EV8jE/QNZvdomd9s8ppff6e1YiT5lzjZQ/4VvgcFVz1jQfZV9DxGqOMMOrM6JqKSG+rnIx1WdOlovdoiKwuzaYan4VMbxexPt+e+aESxXQqqfvvLziFh0LqwQJMOMMvimzE5g/Aa7w='
//        }
//    },
//    query: {
//        signature: 'e79f8fe1578975d9baf90e53a41bf42ce440d7be',
//        timestamp: '1532698982',
//        nonce: '936592860',
//        encrypt_type: 'aes',
//        msg_signature: 'a4532e223b8c1ed1268231999f54c3ffe7470272'
//    }
//}, () => {
//});
