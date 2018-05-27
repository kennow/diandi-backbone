const fs = require('fs');
const path = require('path');
const co = require('co');
const __LOGGER__ = require('../log4js.service').getLogger('aliyun.oss.service.js');
const __OSS__ = require('ali-oss');
const __STS__ = require('ali-oss').STS;
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
//const client = setUpClient();

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
function setUpClient() {
    var conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'aliyun.oss.config.json')));

    return new __OSS__.Wrapper({
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

    //co(function* () {
    //    client.useBucket('chinai');
    //    var result = yield client.list({
    //        'max-keys': 5
    //    });
    //    console.log(result);
    //}).catch(function (err) {
    //    console.log(err);
    //});

    //co(function* () {
    //    client.useBucket('chinai');
    //    var result = yield client.put('first-child', path.join(aliyunOssServiceRootPath, 'config.json'));
    //    console.log(result);
    //}).catch(function (err) {
    //    console.log(err);
    //});

    //co(function* () {
    //    client.useBucket('chinai');
    //    var result = yield client.get('first-child', path.join(aliyunOssServiceRootPath, 'config.json.bak'));
    //    console.log(result);
    //}).catch(function (err) {
    //    console.log(err);
    //});

    //co(function* () {
    //    client.useBucket('chinai');
    //    var result = yield client.delete('first-child');
    //    console.log(result);
    //}).catch(function (err) {
    //    console.log(err);
    //});

    //co(function* () {
    //    var result = yield client.getBucketACL('chinai');
    //    console.log(result);
    //}).catch(function (err) {
    //    console.log(err);
    //});

    //client
    //    .useBucket('chinai')
    //    .put('newOne', path.join(aliyunOssServiceRootPath, 'config.json'))
    //    .then(function (r1) {
    //        __LOGGER__.info('=============  put success: ============');
    //        __LOGGER__.debug(r1);
    //        return client.get('newOne');
    //    })
    //    .then(function (r2) {
    //        __LOGGER__.info('=============  get success: ============');
    //        res.json(r2)
    //    })
    //    .catch(function (err) {
    //        __LOGGER__.error('error: %j', err);
    //    });

    //client
    //    .useBucket('chinai');
    //
    //var url = client.signatureUrl('newOne');
    //console.log(url);
    //
    //url = client.signatureUrl('newOne', {expires: 3600});
    //console.log(url);
    //
    //// signed URL for PUT
    //url = client.signatureUrl('newOne', {method: 'PUT'});
    //console.log(url);


}

function setUpClientUsingSTS() {
    let conf = JSON.parse(fs.readFileSync(path.join(__dirname, 'aliyun.oss.config.json')));
    let sts = new __STS__({
        accessKeyId: conf.STSAccessKeyId,
        accessKeySecret: conf.STSAccessKeySecret
    });

    let policy;
    if (conf.STSPolicyFile) {
        policy = fs.readFileSync(path.join(__dirname, 'policy', conf.STSPolicyFile)).toString('utf-8');
    }

    co(function*() {
        let token = yield sts.assumeRole(conf.STSRoleArn, policy, conf.STSTokenExpireTime);
        let store = new __OSS__.Wrapper({
            accessKeyId: token.credentials.AccessKeyId,
            accessKeySecret: token.credentials.AccessKeySecret,
            stsToken: token.credentials.SecurityToken,
            bucket: conf.Bucket,
            endpoint: conf.Endpoint,
            cname: true
        });
        __LOGGER__.debug(store);

        return store;
    }).catch(function (err) {
        __LOGGER__.error(err);
    });


}

function list(options) {

    client
        .list(options)
        .then(function (r1) {
            __LOGGER__.debug(r1);

            r1.prefixes.forEach(function (subDir) {
                console.log('SubDir: %s', subDir);
            });
        })
        .catch(function (err) {
            __LOGGER__.error('error: %j', err);
        });
}

function signedUrl() {

}

module.exports = {
    list: list
};

//list({
//    prefix: 'tmp/',
//    delimiter: '/'
//});

let stsClient = setUpClientUsingSTS();

/**
 * URL签名示例:
 * http://oss-example.oss-cn-hangzhou.aliyuncs.com/oss-api.pdf?OSSAccessKeyId=nz2pc56s936**9l&Expires=1141889120&Signature=vjbyPxybdZaNmGa%2ByT272YEAiv4%3D
 */

//var url = __UTIL__.format(
//    'https://%s?Format=%s&Version=%s&Signature=%s&SignatureMethod=%s&SignatureNonce=%s&SignatureVersion=%s&AccessKeyId=%s&Timestamp=%s',
//    'media.thinmelon.cc/newOne',
//    'xml',
//    '2015-04-01',
//    'Pc5WB8gokVn0xfeu%2FZV%2BiNM1dgI%3D',
//    'HMAC-SHA1',
//    '15215528852396',
//    '1.0',
//    'STS.NHuWn3g9nh2jbRysX44u4ixEY',
//    '2012-06-01T12:00:00Z'
//);

//__LOGGER__.debug(url);

//__HTTP_CLIENT__.doHttpsGet('https://chinai.oss-cn-hangzhou.aliyuncs.com/tmp/IMG_20180507_0001.jpg?OSSAccessKeyId=LTAIAam6h0DpIzqI&Expires=3054815530&Signature=RO4BF1kJ6apJrMI3UiYk0%2FIzhF8%3D', function (rawData) {
//    //__LOGGER__.debug(rawData)
//});

