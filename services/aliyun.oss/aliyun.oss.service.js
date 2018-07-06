const fs = require('fs');
const path = require('path');
const co = require('co');
const Q = require('q');
const __LOGGER__ = require('../log4js.service').getLogger('aliyun.oss.service.js');
const __OSS__ = require('ali-oss');
const __STS__ = require('ali-oss').STS;

//{
//    "Region": "oss-cn-hangzhou",
//    "AccessKeyId": "LTAILKrlLSQ0Zfss",
//    "AccessKeySecret": "op4oxHaxVIRb2L7nh3uPmuCvcTnhiV",
//    "Endpoint": "https://media.thinmelon.cc",
//    "Bucket": "chinai",
//    "STSRoleArn": "acs:ram::1698608069362176:role/aliyunosstokengeneratorrole",
//    "STSTokenExpireTime": "900",
//    "STSPolicyFile": "all_policy.txt"
//}

/**
 *  配置项
 *
 *  [accessKeyId] {String} 通过阿里云控制台创建的access key。
 *  [accessKeySecret] {String} 通过阿里云控制台创建的access secret。
 *  [bucket] {String} 通过控制台创建的bucket, 或通过putBucket创建。
 *  [endpoint] {String} oss 域名。
 *  [region] {String} bucket 所在的区域, 默认 oss-cn-hangzhou。
 *  [internal] {Boolean} 是否使用阿里云内部网访问，比如采用ecs访问oss，设置true, 采用internal的endpoint 会节约费用, 默认false。
 *  [secure] {Boolean} (secure: true) 使用 HTTPS , (secure: false) 则使用 HTTP, 细节请看。
 *  [timeout] {String|Number} 超时时间, 默认 60s。
 */
function setUpClient(request) {
    const deferred = Q.defer();
    let conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'aliyun.oss.config.json')));
    let client = new __OSS__.Wrapper({
        /**
         * Region 表示 OSS 的数据中心所在的地域，物理位置。用户可以根据费用、请求来源等综合选择数据存储的 Region。
         */
        region: conf.Region,
        /**
         * AccessKey，简称 AK，指的是访问身份验证中用到的 AccessKeyId 和AccessKeySecret。
         * OSS 通过使用 AccessKeyId 和 AccessKeySecret 对称加密的方法来验证某个请求的发送者身份。
         * AccessKeyId 用于标识用户，AccessKeySecret 是用户用于加密签名字符串和 OSS 用来验证签名字符串的密钥
         */
        accessKeyId: conf.AccessKeyId,              //  用户名： AliyunOSSFullUser
        accessKeySecret: conf.AccessKeySecret,
        /**
         * 存储空间是您用于存储对象（Object）的容器，所有的对象都必须隶属于某个存储空间。
         * 您可以设置和修改存储空间属性用来控制地域、访问权限、生命周期等，这些属性设置直接作用于该存储空间内所有对象
         */
        bucket: conf.Bucket,
        endpoint: conf.Endpoint,
        cname: true
    });
    deferred.resolve({
        client: client,
        options: request.options
    });

    return deferred.promise;
}

/**
 * OSS可以通过阿里云STS服务，临时进行授权访问。使用STS时请按以下步骤进行：
 *  1.  在官网控制台创建子账号，参考OSS STS。
 *  2.  在官网控制台创建STS角色并赋予子账号扮演角色的权限，参考OSS STS。
 *  3.  使用子账号的AccessKeyId/AccessKeySecret向STS申请临时token。
 *  4.  使用临时token中的认证信息创建OSS的Client。
 *  5.  使用OSS的Client访问OSS服务。
 * @param request
 * @returns {*|C|promise}
 */
function fetchSTSToken(request) {
    const deferred = Q.defer();

    let conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'aliyun.oss.config.json')));
    let sts = new __STS__({
        accessKeyId: conf.AccessKeyId,
        accessKeySecret: conf.AccessKeySecret
    });

    // 在向STS申请临时token时，还可以指定自定义的STS Policy
    // 这样申请的临时权限是所扮演角色的权限与Policy指定的权限的交集
    let policy;
    if (conf.STSPolicyFile) {
        policy = fs.readFileSync(path.join(__dirname, 'policy', conf.STSPolicyFile)).toString('utf-8');
    }

    co(function*() {
        let token = yield sts.assumeRole(conf.STSRoleArn, policy, conf.STSTokenExpireTime);
        let client = new __OSS__.Wrapper({
            accessKeyId: token.credentials.AccessKeyId,
            accessKeySecret: token.credentials.AccessKeySecret,
            stsToken: token.credentials.SecurityToken,
            bucket: conf.Bucket,
            endpoint: conf.Endpoint,
            cname: true
        });
        deferred.resolve({
            client: client,
            options: request.options
        });
    }).catch(function (err) {
        deferred.reject(err.message);
    });

    return deferred.promise;
}

/**
 *      查看所有文件
 *
 * 通过list来列出当前Bucket下的所有文件。主要的参数如下：
 *      -   prefix 指定只列出符合特定前缀的文件
 *      -   marker 指定只列出文件名大于marker之后的文件
 *      -   delimiter 用于获取文件的公共前缀
 *      -   max-keys 用于指定最多返回的文件个数
 * @param request
 * @returns {*|{res, objects, prefixes, nextMarker, isTruncated}}
 */
function list(request) {
    return request.client.list(request.options);
}

/**
 * 直接访问
 *  --  调用 client 的 signatureUrl 方法生成资源的 URL
 * @param request
 * @returns {*|C|promise}
 */
function directAccessObject(request) {
    const deferred = Q.defer();
    //__LOGGER__.debug(request.client);
    let requestUrl = request.client.signatureUrl(
        request.options.resource,
        {}
    );
    __LOGGER__.info(requestUrl);
    deferred.resolve(requestUrl);

    return deferred.promise;
}

//setUpClient({
//    options: {
//        resource: 'IMG_2527.JPG'
//    }
//})
//    .then(directAccessObject)
//    .then(url => {
//        'use strict';
//        //__LOGGER__.info(url);
//    });

/**
 * 通过STS访问
 *
 * @param request
 * @returns {*|C|promise}
 */
function stsAccessObject(request) {
    const deferred = Q.defer();

    let stsToken = request.client.options.stsToken;
    let sign = request.client.signatureUrl(
        request.options.resource,
        {
            'security-token': stsToken
        }
    );
    deferred.resolve(sign);

    return deferred.promise;
}

// fetchSTSToken({
//     options: {
//         resource: 'tmp/IMG_20180507_0001.jpg'
//     }
// })
//     .then(stsAccessObject)
//     .then(res => {
//         __LOGGER__.debug(res);
//     });

/**
 *      流式上传
 *
 * 通过putStream接口来上传一个Stream中的内容，stream参数可以是任何实现了Readable Stream的对象，包含文件流，网络流等。
 * @param request
 * @returns {Object|*}
 */
function putStream(request) {
    const deferred = Q.defer();
    request.options.retransmission++;
    __LOGGER__.info('============== 第' + request.options.retransmission + '次传送 ==============');
    let stream = fs.createReadStream(request.options.filePath);
    request.client
        .putStream(request.options.targetFolder + '/' + request.options.fileName, stream)
        .then(res => {
            deferred.resolve(res);
        })
        .catch(exception => {
            __LOGGER__.warn(exception.message);
            deferred.reject(request);
        });
    return deferred.promise;
}

/**
 *      失败重传
 *          -   默认重复 3 次
 *
 * @param request
 * @returns {*}
 */
function retransmission(request) {
    let promise = Q(request);

    promise = promise.then(request.options.redoFn);
    for (let i = 0; i < 3; i++) {
        promise = promise.then(1, request.options.redoFn);
    }

    return promise;
}

/**
 * 在需要上传的文件较大时，可以通过multipartUpload接口进行分片上传。
 * 分片上传的好处是将一个大请求分成多个小请求来执行，这样当其中一些请求失败后，不需要重新上传整个文件，而只需要上传失败的分片就可以了。
 * 一般对于大于100MB的文件，建议采用分片上传的方法
 *
 * name {String} object 名称
 * file {String|File} file path or HTML5 Web File
 * [options] {Object} 额外参数
 *      [checkpoint] {Object} 断点记录点，可以进行断点续传, 如果设置这个参数，上传会从断点开始，如果没有设置，就会重新上传.
 *      [partSize] {Number} 分片大小
 *      [progress] {Function} thunk 或 generator形式, 回调函数包含三个参数
 *          (percentage {Number} 进度百分比(0-1之间小数)
 *          checkpoint {Object} 断点记录点
 *          res {Object}) 单次part成功返回的response
 *      [meta] {Object} 用户自定义header meta信息, header前缀 x-oss-meta-
 *      [headers] {Object} extra headers, detail see RFC 2616
 *          ‘Cache-Control’ 通用消息头被用于在http 请求和响应中通过指定指令来实现缓存机制, e.g.: Cache-Control: public, no-cache
 *          ‘Content-Disposition’ 指示回复的内容该以何种形式展示，是以内联的形式（即网页或者页面的一部分），还是以附件的形式下载并保存到本地,
 *              e.g.: Content-Disposition: somename
 *          ‘Content-Encoding’ 用于对特定媒体类型的数据进行压缩, e.g.: Content-Encoding: gzip
 *          ‘Expires’ 过期时间, e.g.: Expires: 3600000
 * @param request
 */
function multipartUpload(request) {
    const deferred = Q.defer();
    request.options.retransmission++;
    __LOGGER__.info('============== 第' + request.options.retransmission + '次传送 ==============');
    request.client
        .multipartUpload(request.options.targetFolder + '/' + request.options.fileName, request.options.filePath, {
            checkpoint: request.options.checkpoint,         //  断点续传
            progress: function*(percentage, checkpoint, res) {
                __LOGGER__.info('Progress: ' + percentage);
                request.options.checkpoint = checkpoint;
                __LOGGER__.debug(checkpoint);
            }
        })
        .then(res => {
            deferred.resolve(res);
        })
        .catch(exception => {
            __LOGGER__.warn(exception);
            deferred.reject(request);
        });

    return deferred.promise;
}

/**
 *
 * @returns {*|promise|C}
 */
function getStream(request) {
    const deferred = Q.defer();

    request.client
        .getStream(request.options.resource)
        .then(res => {
            // __LOGGER__.debug(res);
            deferred.resolve(res);
        })
        .catch(exception => {
            __LOGGER__.error(exception);
            deferred.reject(exception);
        });

    return deferred.promise;
}


module.exports = {
    setUpClient: setUpClient,
    list: list,
    getStream: getStream,
    putStream: putStream,
    retransmission: retransmission,
    multipartUpload: multipartUpload,
    fetchSTSToken: fetchSTSToken,
    directAccessObject: directAccessObject,
    stsAccessObject: stsAccessObject
};
