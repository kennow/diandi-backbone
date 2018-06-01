const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('aliyun.oss.route.js');
const __STORE__ = require('../controller/store.controller');
const multiparty = require('connect-multiparty');
const __MULTI_PARTY_MIDDLEWARE__ = multiparty();

/**
 *   鉴权
 */
router.get('/:session', function (req, res, next) {
    __LOGGER__.info('========================== STS ==========================');
    __LOGGER__.debug(req.params);

    __STORE__.fetchSTSToken(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   上传图片
 *      --  支持重传机制
 */
router.post('/image/new', __MULTI_PARTY_MIDDLEWARE__, function (req, res, next) {
    __LOGGER__.info('========================== UPLOAD IMAGE ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.files);

    __STORE__.uploadFile(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *   上传视频
 *      --  使用分片上传
 *      --  支持断点续传
 */
router.post('/video/new', __MULTI_PARTY_MIDDLEWARE__, function (req, res, next) {
    __LOGGER__.info('========================== UPLOAD VIDEO ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.files);

    __STORE__.multipartUpload(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;