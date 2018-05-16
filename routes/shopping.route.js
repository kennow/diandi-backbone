const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.route.js');
const __CONTROLLER_SHOPPING__ = require('../controller/shopping.controller');

function render(request, response, next) {
    if ('SUCCESS' === request.return_code) {
        response.json(request);
    } else {
        var err = new Error(request.return_msg);
        next(err);
    }
}

router.get('/product/list', function (req, res, next) {
    __LOGGER__.info('========================== Product List ==========================');
    __LOGGER__.debug(req.params);
    __CONTROLLER_SHOPPING__.fetchProductList(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  查询订单
 */
router.get('/order/:id', function (req, res, next) {
    __LOGGER__.info('========================== Query Order ==========================');
    __LOGGER__.debug(req.params);
    __CONTROLLER_SHOPPING__.queryOrder(req, function (request) {
        render(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  提交新订单
 */
router.post('/order/new', function (req, res, next) {
    __LOGGER__.info('========================== Submit New Order ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.submitUnifiedOrder(req, function (request) {
        render(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  微信支付结果通知
 */
router.all('/wechat_pay/notification', function (req, res, next) {
    __LOGGER__.info('===================== Wechat Pay Notification =====================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.receivePayResultNotification(req, function (request) {
        res.send(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;
