const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __OFFICIAL_ACCOUNT_API__ = require('./wechat.official.account.api');
const __SERVICE_ACCESS_TOKEN__ = require('../wechat.access_token/wechat.access_token.service');

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

module.exports = {
    createMenu: createMenu,
    deleteMenu: deleteMenu
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