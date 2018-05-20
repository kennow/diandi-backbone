const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('user.route.js');
const __USER__ = require('../controller/user.controller');

/**
 *   登录
 */
router.post('/login', function (req, res, next) {
    __LOGGER__.info('========================== Login ==========================');
    __LOGGER__.debug(req.params);
    __USER__.login(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   新增收件人
 */
router.post('/new/consignee/:session', function (req, res, next) {
    __LOGGER__.info('========================== New Consignee ==========================');
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.body);
    __USER__.addConsignee(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   编辑收件人
 */
router.post('/edit/consignee/:session', function (req, res, next) {
    __LOGGER__.info('========================== Edit Consignee ==========================');
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.body);
    __USER__.editConsignee(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   设置为缺省收件人
 */
router.post('/default/consignee/:session', function (req, res, next) {
    __LOGGER__.info('========================== Set As Default Consignee ==========================');
    __LOGGER__.debug(req.params);
    __LOGGER__.debug(req.body);
    __USER__.setAsDefaultConsignee(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   获取缺省收件人信息
 */
router.get('/default/consignee/:session', function (req, res, next) {
    __LOGGER__.info('========================== Set As Default Consignee ==========================');
    __LOGGER__.debug(req.params);
    __USER__.fetchDefaultConsignee(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});


/**
 *   我的收件人列表
 */
router.get('/my/consignee/:session', function (req, res, next) {
    __LOGGER__.info('========================== My Consignee ==========================');
    __LOGGER__.debug(req.params);
    __USER__.fetchMyConsignee(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   我的购物车
 */
router.get('/my/cart/:session', function (req, res, next) {
    __LOGGER__.info('========================== My Cart ==========================');
    __LOGGER__.debug(req.params);
    __USER__.fetchMyCart(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  添加至购物车
 */
router.post('/cart/new', function (req, res, next) {
    __LOGGER__.info('========================== Join To Cart ==========================');
    __LOGGER__.debug(req.body);
    __USER__.joinToCart(req, function (request) {
        res.json(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  更新我的购物车
 */
router.post('/cart/update', function (req, res, next) {
    __LOGGER__.info('========================== Update My Cart ==========================');
    __LOGGER__.debug(req.body);
    __USER__.updateMyCart(req, function (request) {
        res.json(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  从购物车中移除商品
 */
router.post('/cart/remove', function (req, res, next) {
    __LOGGER__.info('========================== Remove Item From Cart ==========================');
    __LOGGER__.debug(req.body);
    __USER__.removeMyCart(req, function (request) {
        res.json(request, res, next);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;