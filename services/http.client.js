const __HTTP__ = require('http');
const __HTTPS__ = require('https');
const __URL_PARSER__ = require('url');
const __QUERY_STRING__ = require('querystring');
const __LOGGER__ = require("../services/log4js.service").getLogger("http.client.js");

/**
 * GET 请求 -- HTTPS
 * @param url
 * @param callback
 */
function doHttpsGet(url, callback) {
    __LOGGER__.info('doHttpsGet ==> ' + url);
    __HTTPS__.get(url, function (response) {
        var data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            __LOGGER__.debug('=====  返回结果：' + data);
            callback(data);
            __LOGGER__.info('===== 结束【doHttpsGet】 =====');
        });
    }).on('error', function (error) {
        __LOGGER__.error(error);
    });
}

/**
 * GET 请求 -- HTTPS
 * @param url
 * @param callback
 */
function doHttpGet(url, callback) {
    __LOGGER__.info('doHttpGet ==> ' + url);
    __HTTP__.get(url, function (response) {
        var data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function () {
            __LOGGER__.debug('=====  返回结果：' + data);
            callback(data);
            __LOGGER__.info('===== 结束【doHttpsGet】 =====');
        });
    }).on('error', function (error) {
        __LOGGER__.error(error);
    });
}


/**
 * POST 请求 -- HTTPS
 * @param url
 * @param data
 * @param callback
 */
function doHttpsPost(url, data, callback) {
    const tmp = __URL_PARSER__.parse(url);
    const postData = JSON.stringify(data);
    const isHttp = tmp.protocol === 'http:';
    const options = {
        host: tmp.hostname,
        port: tmp.port || (isHttp ? 80 : 443),
        path: tmp.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    __LOGGER__.info('=====  doHttpPost2 ==> URL: ' + url);
    __LOGGER__.info('=====  doHttpPost2 ==> options: ' + JSON.stringify(options));
    const req = __HTTPS__.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            __LOGGER__.debug('=====  返回结果：' + data);
            callback(data);
            __LOGGER__.info('===== 结束【doHttpsPost】=====');
        });
    });
    req.on('error', function (e) {
        __LOGGER__.error(e.message);
    });
    req.write(postData);
    req.end();
}

/**
 * POST请求 -- HTTP
 * @param host
 * @param port
 * @param data
 * @param callback
 */
function doHttpPost(host, port, data, callback) {
    const postData = __QUERY_STRING__.stringify(data);
    const options = {
        host: host,
        port: port,
        path: '',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    __LOGGER__.info('=====  doHttpPost ==> options: ' + JSON.stringify(options));
    const req = __HTTP__.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            __LOGGER__.debug('=====  返回结果：' + data);
            callback(data);
            __LOGGER__.info('===== 结束【doHttpPost】 =====');
        });
    });
    req.on('error', function (e) {
        __LOGGER__.error(e.message);
    });
    req.write(postData);
    req.end();
}

module.exports = {
    doHttpGet: doHttpGet,
    doHttpsGet: doHttpsGet,
    doHttpPost: doHttpPost,
    doHttpsPost: doHttpsPost
};
