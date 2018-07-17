const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('shopping.route.js');
const __CONTROLLER_SHOPPING__ = require('../controller/shopping.controller');

function render(request, response, next) {
    if ('SUCCESS' === request.return_code) {
        response.json(request);
    } else {
        let err = new Error(request.return_msg);
        next(err);
    }
}

/**
 *  商品列表
 */
router.get('/product/list', function (req, res, next) {
    __LOGGER__.info('========================== Product List ==========================');
    __LOGGER__.debug(req.params);
    __CONTROLLER_SHOPPING__.fetchProductList(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   商品详情
 */
router.get('/product/detail/:id', function (req, res, next) {
    __LOGGER__.info('========================== Product Detail ==========================');
    __LOGGER__.debug(req.params);
    __CONTROLLER_SHOPPING__.fetchProductDetail(req, function (request) {
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
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  提交新订单
 */
router.post('/order', function (req, res, next) {
    __LOGGER__.info('========================== Submit New Order ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.submitUnifiedOrder(req, function (request) {
        render(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  重新支付
 */
router.post('/order/repay', function (req, res, next) {
    __LOGGER__.info('========================== Repay ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.repay(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  关闭订单
 */
router.delete('/order', function (req, res, next) {
    __LOGGER__.info('========================== Close Order ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.closeOrder(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   查询退款进度
 */
router.post('/refund/progress', function (req, res, next) {
    __LOGGER__.info('========================== Refund Info ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.fetchRefundInfo(req, function (request) {
        res.json(request);
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

/**
 *  退款结果通知
 */
router.all('/wechat_pay/refund/notification', function (req, res, next) {
    __LOGGER__.info('===================== Refund Notification =====================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.receiveRefundResultNotification(req, function (request) {
        res.send(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  将卡券放入微信卡包
 */
router.post('/card/holder', function (req, res, next) {
    __LOGGER__.info('========================== PUT INTO WECHAT CARD HOLDER ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.putCouponIntoCardHolder(req.body, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;
