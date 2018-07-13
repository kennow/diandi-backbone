const Q = require('q');
const __UTIL__ = require('util');
const __FILE_SYSTEM__ = require('fs');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.poi.service.js');
const __API__ = require('./wechat.poi.api');
const __STRUCTURE__ = require('./wechat.poi.structure');
const __SERVICE_ACCESS_TOKEN__ = require('../wechat.access_token/wechat.access_token.service');

function uploadPoiImage(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__UPLOAD_POI_IMAGE__, request.access_token),
            __FILE_SYSTEM__.readFileSync('logo.png', 'utf8'),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 查询门店列表
 * 商户可以通过该接口，批量查询自己名下的门店list，并获取已审核通过的poiid、商户自身sid 用于对应、商户名、分店名、地址字段。
 * @param request
 */
function fetchPoiList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__FETCH_POI_LIST__, request.access_token),
            __STRUCTURE__.constructFetchPoiList(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 查询门店信息
 * 创建门店后获取poi_id 后，商户可以利用poi_id，查询具体某条门店的信息
 * 若在查询时，update_status 字段为1，表明在5 个工作日内曾用update 接口修改过门店扩展字段，该扩展字段为最新的修改字段，尚未经过审核采纳，因此不是最终结果
 * 最终结果会在5 个工作日内，最终确认是否采纳，并前端生效
 * @param request
 * @returns {*|C|promise}
 */
function fetchPoiDetail(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__FETCH_POI_DETAIL__, request.access_token),
            __STRUCTURE__.constructFetchPoiDetail(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(fetchPoiList)
//     .then(res => {
//         console.log(res);
//     });

//  "poi_id":"215645680"

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(uploadPoiImage)
//     .then(res => {
//         console.log(res);
//     });

