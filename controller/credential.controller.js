const __CREDENTIAL_SERVICE__ = require('../services/wechat.mini.program/credential.service');
const __USER__ = require('../database/user.api');
const __LOGGER__ = require('../services/log4js.service').getLogger('credential.controller.js');

/**
 * 小程序登录
 *  小程序可以通过微信官方提供的登录能力方便地获取微信提供的用户身份标识，快速建立小程序内的用户体系。
 * @param request
 * @param response
 */
function login(request, response) {
    __CREDENTIAL_SERVICE__
        .fetchUserOpenId(request.params.code)
        .then(__USER__.wechatMiniProgramLogin)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

module.exports = {
    login: login
};

// login({
//     params: {
//         code: '0710Sxug2GsMOB07uuug2yYuug20SxuS'
//     }
// }, function (result) {
//
// });
