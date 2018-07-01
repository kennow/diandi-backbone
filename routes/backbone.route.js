const express = require('express');
const router = express.Router();
const multiparty = require('connect-multiparty');
const __MULTI_PARTY_MIDDLEWARE__ = multiparty();
const __LOGGER__ = require('../services/log4js.service').getLogger('backbone.route.js');
const __CONTROLLER_SHOPPING__ = require('../controller/shopping.controller');
const __CONTROLLER_STORE__ = require('../controller/store.controller');
const __CONTROLLER_USER__ = require('../controller/user.controller');
const __CONTROLLER_SYSTEM__ = require('../controller/system.controller');

/**
 *   商品列表
 */
router.get('/product/list', function (req, res, next) {
    __LOGGER__.info('========================== Product List ==========================');
    __LOGGER__.debug(req.query);
    __CONTROLLER_SHOPPING__.fetchProductList(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *    上传商品微缩图
 */
router.post('/product/thumbnail', __MULTI_PARTY_MIDDLEWARE__, function (req, res, next) {
    __LOGGER__.info('========================== Thumbnail ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.files);

    __CONTROLLER_STORE__.uploadFile(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      新增商品属性
 */
router.post('/product/attributes', function (req, res, next) {
    __LOGGER__.info('========================== New Attributes ==========================');
    __LOGGER__.debug(req.body);

    __CONTROLLER_SHOPPING__.newAttributes(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      新增商品
 */
router.post('/product', function (req, res, next) {
    __LOGGER__.info('========================== New Product ==========================');
    __LOGGER__.debug(req.body);

    __CONTROLLER_SHOPPING__.newProduct(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      移除商品
 */
router.post('/product/dead', function (req, res, next) {
    __LOGGER__.info('========================== Remove Product ==========================');
    __LOGGER__.debug(req.body);

    __CONTROLLER_SHOPPING__.removeProduct(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      修改商品状态
 */
router.post('/product/status', function (req, res, next) {
    __LOGGER__.info('========================== Change Product Status ==========================');
    __LOGGER__.debug(req.body);

    __CONTROLLER_SHOPPING__.changeProductStatus(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      订单列表
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
 *      查询某订单
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
 *      获取用户资料
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
 *      查询退款进度
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
 *      发起退款
 */
router.post('/refund', function (req, res, next) {
    __LOGGER__.info('========================== Trigger Refund ==========================');
    __LOGGER__.debug(req.body);
    __CONTROLLER_SHOPPING__.refund(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      发送短信
 */
router.post('/sms', function (req, res, next) {
    __LOGGER__.info('========================== SEND SMS ==========================');
    __LOGGER__.info(req.body);
    __CONTROLLER_SYSTEM__.sendSMS(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *      登录
 */
router.post('/login', function (req, res, next) {
    __LOGGER__.info('========================== LOGIN ==========================');
    __LOGGER__.info(req.body);
    __CONTROLLER_USER__.backboneLogin(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});


module.exports = router;