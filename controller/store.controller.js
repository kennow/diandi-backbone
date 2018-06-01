const __ALIYUN_OSS_SERVICE__ = require('../services/aliyun.oss/aliyun.oss.service');
const __USER__ = require('../database/user.api');
const __HELPER__ = require('../utility/helper');
const __LOGGER__ = require('../services/log4js.service').getLogger('store.controller.js');

/**
 *       访问STS获取临时Token
 *
 * @param request
 * @param response
 */
function fetchSTSToken(request, response) {
    __USER__
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
    const tmpFile = request.files[request.body.fieldName];
    __LOGGER__.debug(__HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.')));
    __ALIYUN_OSS_SERVICE__.setUpClient({
        options: {
            retransmission: 0,
            filePath: tmpFile.path,
            fileName: __HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.')),
            fileSize: tmpFile.size,
            redoFn: __ALIYUN_OSS_SERVICE__.putStream
        }
    })
        .then(__ALIYUN_OSS_SERVICE__.retransmission)
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
    const tmpFile = request.files[request.body.fieldName];
    __LOGGER__.debug(__HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.')));
    __ALIYUN_OSS_SERVICE__.setUpClient({
        options: {
            retransmission: 0,
            filePath: tmpFile.path,
            fileName: __HELPER__.generateRandomFileName() + tmpFile.name.substr(tmpFile.name.lastIndexOf('.')),
            fileSize: tmpFile.size,
            redoFn: __ALIYUN_OSS_SERVICE__.multipartUpload
        }
    })
        .then(__ALIYUN_OSS_SERVICE__.retransmission)
        .then(request => {
            __LOGGER__.debug(request);
            response(request);
        })
        .catch(function (exception) {
            response(exception.message || 'ERROR: multipartUpload');
        });
}

module.exports = {
    fetchSTSToken: fetchSTSToken,
    uploadFile: uploadFile,
    multipartUpload: multipartUpload
};

// multipartUpload({
//     body: {fieldName: 'wxChooseVideo'},
//     files: {
//         wxChooseVideo: {
//             fieldName: 'wxChooseVideo',
//             originalFilename: 'Wildlife.wmv',
//             // path: '/tmp/lxUcQW6cJ9SHzzlQ_ZxdBbKg.jpg',
//             path: 'Wildlife.wmv',
//             headers: {
//                 'content-disposition': 'form-data; name="wxChooseImage"; filename="wxc91180e424549fbf.o6zAJswtOGdvdBzvKkPZXBQS-HeQ.MlJ8bm6YSZ0ua75c13d93aaa348da7dbe15935321f28.jpg"',
//                 'content-type': 'image/jpeg'
//             },
//             size: 663651,
//             name: 'Wildlife.wmv',
//             type: 'wmv'
//         }
//     }
// }, function (res) {
//     console.log('================>  in the end');
//     // console.dir(res);
// });

// uploadFile({
//     body: {fieldName: 'wxChooseImage'},
//     files: {
//         wxChooseImage: {
//             fieldName: 'wxChooseImage',
//             originalFilename: 'wxc91180e424549fbf.o6zAJswtOGdvdBzvKkPZXBQS-HeQ.MlJ8bm6YSZ0ua75c13d93aaa348da7dbe15935321f28.jpg',
//             // path: '/tmp/lxUcQW6cJ9SHzzlQ_ZxdBbKg.jpg',
//             path: 'READ.md',
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