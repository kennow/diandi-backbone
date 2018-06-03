const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('backbone.route.js');
const __CONTROLLER_SHOPPING__ = require('../controller/shopping.controller');
const __CONTROLLER_USER__ = require('../controller/user.controller');

/**
 *   订单列表
 */
router.get('/order/list', function (req, res, next) {
    __LOGGER__.info('========================== Order List ==========================');
    __LOGGER__.debug(req.query);
    __CONTROLLER_SHOPPING__.fetchOrderList(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   查询某订单
 */
router.get('/order/:out_trade_no', function (req, res, next) {
    __LOGGER__.info('========================== Specific Order Info ==========================');
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.query);
    __CONTROLLER_SHOPPING__.fetchAOrder(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   获取用户资料
 */
router.post('/user', function (req, res, next) {
    __LOGGER__.info('========================== User Info ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_USER__.fetchUserInfo(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   查询退款进度
 */
router.post('/refund', function (req, res, next) {
    __LOGGER__.info('========================== Refund Info ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.fetchRefundInfo(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;