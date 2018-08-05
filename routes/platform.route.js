const express = require('express');
const router = express.Router();
const __FILE_SYSTEM__ = require('fs');
const __PATH__ = require('path');
const __PLATFORM__ = require('../controller/platform.controller');
const __LOGGER__ = require('../services/log4js.service').getLogger('backbone.route.js');

/**
 *  创建第三方平台时用于校验
 */
// router.all('/:object', function (req, res, next) {
//     __LOGGER__.info('========================== ENTRY ==========================');
//     __LOGGER__.debug(req.body);
//     __LOGGER__.debug(req.params);
//     __LOGGER__.debug(req.query);
//
//     let realPath = __PATH__.join(__PATH__.resolve(__dirname, '..'), 'credentials', 'platform', req.params.object);
//     __LOGGER__.debug(realPath);
//
//     __FILE_SYSTEM__.readFile(realPath, function (err, data) {
//         if (err) {
//             res.status(404).end('NOT FOUND');
//         } else {
//             res.status(200).send(data);
//             res.end();
//         }
//     });
//
//     __LOGGER__.info('========================== END ==========================');
// });

/**
 * 用户授权登录开放平台中的网站时，收到的回调通知
 * 接收 CODE
 */
router.all('/website', function (req, res, next) {
    __LOGGER__.info('========================== CODE ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __PLATFORM__.receiveWechatLoginCodeNotification(req, function (request) {
        res.end('success');
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 * 代公众号实现网站授权
 * 当用户向公众号授权进行微信登录等操作时，收到的回调通知
 */
router.all('/code', function (req, res, next) {
    __LOGGER__.info('========================== CODE ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __PLATFORM__.receiveAuthorizerCodeNotification(req, function (request) {
        res.end('success');
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 * 自媒体及商家向第三方平台进行授权时，收到的回调通知
 */
router.all('/license', function (req, res, next) {
    __LOGGER__.info('========================== LICENSE ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __PLATFORM__.receiveLicenseNotification(req, function (request) {
        res.end('success');
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 * 计划：代自媒体及商家实现消息管理，收到的回调通知
 */
router.all('/:appid/notification', function (req, res, next) {
    __LOGGER__.info('========================== AUTHORIZER NOTIFICATION ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __LOGGER__.info('========================== END ==========================');
});

module.exports = router;
