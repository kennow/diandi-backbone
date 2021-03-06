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
 *   是否已购买该商品
 */
router.get('/product/everBought', function (req, res, next) {
    __LOGGER__.info('========================== EVER BOUGHT ==========================');
    __LOGGER__.debug(req.query);
    __CONTROLLER_SHOPPING__.checkEverBought(req, function (request) {
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

/**
 *   在用户领取卡券至微信卡包后，记录用户的领取记录
 */
router.post('/card/user', function (req, res, next) {
    __LOGGER__.info('========================== RECORD USER CARD ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.recordUserCard(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  对应指定订单列表，用户所购买的卡券列表
 */
router.post('/card/user/orders', function (req, res, next) {
    __LOGGER__.info('========================== CARDS IN SPECIFIC ORDERS ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.queryUserCards(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      获取在线商户列表
 */
router.get('/business/online', function (req, res, next) {
    __LOGGER__.info('========================== BUSINESS ONLINE LIST ==========================');
    __LOGGER__.info(req.query);

    __CONTROLLER_SHOPPING__.fetchOnlineBusinessList(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;
