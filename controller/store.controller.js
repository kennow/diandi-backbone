const Q = require('q');
const fs = require('fs');
const __ALIYUN_OSS_SERVICE__ = require('../services/aliyun.oss/aliyun.oss.service');
const __ACCESS_TOKEN_SERVICE__ = require('../services/wechat.access_token/wechat.access_token.service');
const __OFFICIAL_ACCOUNT_SERVICE__ = require('../services/wechat.official.account/wechat.official.account.service');
const __HTTP_CLIENT__ = require('../services/http.client');
const __USER_DATABASE__ = require('../database/user.api');
const __SHOPPING_DATABASE__ = require('../database/shopping.api');
const __HELPER__ = require('../utility/helper');
const __LOGGER__ = require('../services/log4js.service').getLogger('store.controller.js');

/**
 *       访问STS获取临时Token
 *
 * @param request
 * @param response
 */
function fetchSTSToken(request, response) {
    __USER_DATABASE__
        .checkIdentity(request.params)
        .then(__ALIYUN_OSS_SERVICE__.fetchSTSToken)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *      上传文件
 *
 * @param request
 * @param response
 */
function uploadFile(request, response) {
    const tmpFile = request.files[request.body.fieldName || 'file'];
    const ossFileName = __HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.'));
    __LOGGER__.debug(ossFileName);
    __ALIYUN_OSS_SERVICE__.setUpClient({
            options: {
                retransmission: 0,
                filePath: tmpFile.path,
                fileName: ossFileName,
                fileSize: tmpFile.size,
                targetFolder: request.body.folder || 'backbone',
                redoFn: __ALIYUN_OSS_SERVICE__.putStream
            }
        })
        .then(__ALIYUN_OSS_SERVICE__.retransmission)
        .then(request => {
            return Q({
                'name': request.name,
                'type': tmpFile.type,
                'size': tmpFile.size,
                'url': request.url
            });
        })
        .then(__SHOPPING_DATABASE__.addNewImage)
        .then(request => {
            __LOGGER__.debug(request);
            response(request);
        })
        .catch(function (exception) {
            response(exception.message || 'ERROR: putStream');
        });
}

/**
 *      分片上传 --- 支持断点续传
 *
 * @param request
 * @param response
 */
function multipartUpload(request, response) {
    const tmpFile = request.files[request.body.fieldName || 'file'];
    const ossFileName = __HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.'));
    __LOGGER__.debug(ossFileName);
    __ALIYUN_OSS_SERVICE__.setUpClient({
            options: {
                retransmission: 0,
                filePath: tmpFile.path,
                fileName: ossFileName,
                fileSize: tmpFile.size,
                targetFolder: request.body.folder || 'backbone/video',
                redoFn: __ALIYUN_OSS_SERVICE__.multipartUpload
            }
        })
        .then(__ALIYUN_OSS_SERVICE__.retransmission)
        .then(request => {
            __LOGGER__.debug(request);
            return Q({
                'name': request.name,
                'type': tmpFile.type,
                'size': tmpFile.size,
                'url': ''
            });
        })
        .then(__SHOPPING_DATABASE__.addNewImage)
        .then(request => {
            __LOGGER__.debug(request);
            response(request);
        })
        .catch(function (exception) {
            response(exception.message || 'ERROR: multipartUpload');
        });
}

/**
 *      下载文件
 *
 * @param request
 * @param response
 */
function downloadFile(request, response) {
    __LOGGER__.debug(decodeURIComponent(request.params.name));
    __ALIYUN_OSS_SERVICE__
        .setUpClient({
            options: {
                resource: decodeURIComponent(request.params.name)
            }
        })
        .then(__ALIYUN_OSS_SERVICE__.getStream)
        .then(request => {
            // __LOGGER__.debug(request);
            response(request);
        })
        .catch(function (exception) {
            response(exception || 'ERROR: downloadFile');
        });
}

/**
 * 获取公众号文章列表
 * @param request
 * @param response
 */
function fetchOfficialAccountMaterialList(request, response) {
    __ACCESS_TOKEN_SERVICE__
        .accessToken()
        .then(token => {
            return Q({
                access_token: token.access_token,
                offset: request.offset,
                count: request.count
            });
        })
        .then(__OFFICIAL_ACCOUNT_SERVICE__.getMaterialList)
        .then(res => {
            res.item.map(item => {
                __LOGGER__.debug(item.content.news_item[0].title);
            });
            response(res.item);
        })
        .catch(error => {
            'use strict';
            __LOGGER__.error(error);
        });
}

/**
 * 获取公众号的永久素材
 * @param request
 * @param response
 */
function fetchOfficialAccountMaterial(request, response) {
    __ACCESS_TOKEN_SERVICE__
        .accessToken()
        .then(token => {
            return Q({
                access_token: token.access_token,
                media_id: request.params.media_id
            });
        })
        .then(__OFFICIAL_ACCOUNT_SERVICE__.getMaterial)
        .then(material => {
            // __LOGGER__.debug(material);
            __HTTP_CLIENT__.transferToHttpsGet(material.news_item[0].url, rawData => {
                response(rawData);
            });
        })
        .catch(error => {
            __LOGGER__.error(error);
            response(error)
        });
}

module.exports = {
    fetchSTSToken: fetchSTSToken,
    downloadFile: downloadFile,
    uploadFile: uploadFile,
    multipartUpload: multipartUpload,
    fetchOfficialAccountMaterialList: fetchOfficialAccountMaterialList,
    fetchOfficialAccountMaterial: fetchOfficialAccountMaterial
};

// fetchOfficialAccountMaterial({
//     params: {
//         media_id: 'n584HX_l4p6cYQBacvvsy-bt8K3nMEeVPJ9KVIevOvk'
//     }
// }, () => {
// });

// multipartUpload({
//     body: {
//         fieldName: 'wxChooseVideo',
//         folder: 'backbone/video'
//
//     },
//     files: {
//         wxChooseVideo: {
//             fieldName: 'wxChooseVideo',
//             originalFilename: 'Slideshow.mp4',
//             // path: '/tmp/lxUcQW6cJ9SHzzlQ_ZxdBbKg.jpg',
//             path: 'Slideshow.mp4',
//             headers: {
//                 'content-disposition': 'form-data; name="wxChooseVideo"; filename="Slideshow.mp4"',
//                 'content-type': 'mp4'
//             },
//             size: 663651,
//             name: 'Slideshow.mp4',
//             type: 'mp4'
//         }
//     }
// }, function (res) {
//     console.log('================>  in the end');
//     // console.dir(res);
// });

// uploadFile({
//     body: {
//         fieldName: 'wxChooseImage',
//         folder: 'mini-program'
//     },
//     files: {
//         wxChooseImage: {
//             fieldName: 'wxChooseImage',
//             originalFilename: 'wxc91180e424549fbf.o6zAJswtOGdvdBzvKkPZXBQS-HeQ.MlJ8bm6YSZ0ua75c13d93aaa348da7dbe15935321f28.jpg',
//             // path: '/tmp/lxUcQW6cJ9SHzzlQ_ZxdBbKg.jpg',
//             path: '/tmp/1.jpg',
//             headers: {
//                 'content-disposition': 'form-data; name="wxChooseImage"; filename="wxc91180e424549fbf.o6zAJswtOGdvdBzvKkPZXBQS-HeQ.MlJ8bm6YSZ0ua75c13d93aaa348da7dbe15935321f28.jpg"',
//                 'content-type': 'image/jpeg'
//             },
//             size: 663651,
//             name: 'wxc91180e424549fbf.o6zAJswtOGdvdBzvKkPZXBQS-HeQ.MlJ8bm6YSZ0ua75c13d93aaa348da7dbe15935321f28.jpg',
//             type: 'image/jpeg'
//         }
//     }
// }, function (res) {
//     console.log('================>  in the end');
//     console.dir(res);
// });

// fetchSTSToken({
//     body: {
//         session: 'vSbQfJghkKRigLTyf45OLXb1Kqt96Kmh'
//     }
// }, function (result) {
//
// });