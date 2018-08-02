const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __OFFICIAL_ACCOUNT_API__ = require('./wechat.official.account.api');
const __OFFICIAL_ACCOUNT_STRUCTURE__ = require('./wechat.official.account.structure');
const __SERVICE_ACCESS_TOKEN__ = require('../wechat.access_token/wechat.access_token.service');

/**
 * 创建菜单
 * @param request
 * @returns {*|promise|C}
 */
function createMenu(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__CREATE_MENU__, request.access_token),
        request.menu,
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 删除菜单
 * @param request
 * @returns {*|promise|C}
 */
function deleteMenu(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__DELETE_MENU__, request.access_token),
        {},
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 获取素材列表
 * 在新增了永久素材后，开发者可以分类型获取永久素材的列表。
 * 请注意：
 *
 * 1、获取永久素材的列表，也包含公众号在公众平台官网素材管理模块中新建的图文消息、语音、视频等素材
 * 2、临时素材无法通过本接口获取
 * 3、调用该接口需https协议
 * @param request
 * @returns {*|promise|C}
 */
function getMaterialList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_MATERIAL_LIST__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructGetMaterialListParams(request),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

/**
 * 获取永久素材
 *
 * 请注意：临时素材无法通过本接口获取
 * @param request
 * @returns {*|promise|C}
 */
function getMaterial(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpsPost(
        __UTIL__.format(__OFFICIAL_ACCOUNT_API__.__GET_MATERIAL__, request.access_token),
        __OFFICIAL_ACCOUNT_STRUCTURE__.constructGetMaterialParams(request),
        function (rawData) {
            deferred.resolve(JSON.parse(rawData));
        },
        null
    );

    return deferred.promise;
}

module.exports = {
    createMenu: createMenu,
    deleteMenu: deleteMenu,
    getMaterial: getMaterial
};

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             menu: {
//                 'button': [
//                     {
//                         'type': 'miniprogram',
//                         'name': '莆素',
//                         'url': 'http://mp.weixin.qq.com',
//                         'appid': 'wxc91180e424549fbf',
//                         'pagepath': 'pages/shopping/index/index'
//                     }
//                 ]
//             }
//         });
//     })
//     .then(createMenu)
//     .then(res => {
//         console.log(res);
//     });

// deleteMenu({
//     access_token: '12_kjS_g5rT4nkSVe6XyOyEJNId5EkQ9SEfOv7hQhaWC1UmsQ4FHEBjTIYgITfr8EgL3qlozfe7Wkj5DD54fRMajQ3wX1hMQP6OLR9DpkeUTyw'
// })
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         'use strict';
//         return Q({
//             access_token: request.access_token,
//             offset: 9
//         });
//     })
//     .then(getMaterialList)
//     .then(res => {
//         'use strict';
//         console.log(res.item[0].content.news_item[0].title);
//     })
//     .catch(error => {
//         'use strict';
//         console.error(error);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             media_id: 'n584HX_l4p6cYQBacvvsy-bt8K3nMEeVPJ9KVIevOvk'
//         });
//     })
//     .then(getMaterial)
//     .then(res => {
//         console.log(res.news_item[0]);
//     })
//     .catch(error => {
//         console.error(error);
//     });