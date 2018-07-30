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

router.all('/license', function (req, res, next) {
    __LOGGER__.info('========================== LICENSE ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __PLATFORM__.receiveAuthorizationNotification(req, function (request) {
        res.end('success');
        __LOGGER__.info('========================== END ==========================');
    });
});

router.all('/:appid/notification', function (req, res, next) {
    __LOGGER__.info('========================== AUTHORIZER NOTIFICATION ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __LOGGER__.info('========================== END ==========================');
});

module.exports = router;
