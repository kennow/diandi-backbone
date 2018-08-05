const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('store.route.js');
const __STORE__ = require('../controller/store.controller');
const multiparty = require('connect-multiparty');
const __MULTI_PARTY_MIDDLEWARE__ = multiparty();

/**
 *   图片
 */
router.get('/image/:name', function (req, res, next) {
    __LOGGER__.info('========================== IMAGE ==========================');
    __LOGGER__.debug(req.params);

    __STORE__.downloadFile(req, function (request) {
        if (request.hasOwnProperty('res')) {
            // 设置请求的返回头的 Content-Type
            __LOGGER__.info('Set Content-Type as ' + request.res.headers['content-type']);
            res.set('Content-Type', request.res.headers['content-type']);
            request.stream.pipe(res);
        } else {
            __LOGGER__.error(request);
            res.status(404).end();       //  404：未找到错误
        }
        __LOGGER__.info('========================== END ==========================');
    });
});

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
router.post('/image', __MULTI_PARTY_MIDDLEWARE__, function (req, res, next) {
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
router.post('/video', __MULTI_PARTY_MIDDLEWARE__, function (req, res, next) {
    __LOGGER__.info('========================== UPLOAD VIDEO ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.files);

    __STORE__.multipartUpload(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  公众号 -- 图文素材
 */
router.get('/official/material/:media_id', function (req, res, next) {
    __LOGGER__.info('========================== OFFICIAL ACCOUNT MATERIAL ==========================');
    __LOGGER__.debug(req.body);
    __LOGGER__.debug(req.params);

    __STORE__.fetchOfficialAccountMaterial(req, function (request) {
        res.json(request);
        //res.format({
        //    'text/html': function () {
        //        res.send(request);
        //    }
        //});
        __LOGGER__.info('========================== END ==========================');
    });
});

/**
 *  公众号 -- 文章详情
 */
router.get('/official/news', function (req, res, next) {
    __LOGGER__.info('========================== OFFICIAL ACCOUNT NEWS ==========================');
    __LOGGER__.debug(req.query);
    __LOGGER__.debug(req.params);

    __STORE__.fetchOfficialAccountNews(req, function (request) {
        res.format({
            'text/html': function () {
                res.send(request);
            }
        });
        __LOGGER__.info('========================== END ==========================');
    });
});


module.exports = router;