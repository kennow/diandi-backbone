const __SYSTEM__ = require('../database/system.api');
const __ALI_SMS__ = require('../services/aliyun.sms/aliyun.sms.service');
const __LOGGER__ = require('../services/log4js.service').getLogger('system.controller.js');

/**
 * 发送验证码
 * @param request
 * @param response
 */
function sendSMS(request, response) {
    __ALI_SMS__
        .trigger(request.body)
        .then(__SYSTEM__.addSMS)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// sendSMS({
//     body: {
//         phone: '18159393355'
//     }
// }, res => {
//     'use strict';
//     console.log(res);
// });

module.exports = {
    sendSMS: sendSMS
};
