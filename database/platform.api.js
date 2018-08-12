const Q = require('q');
const __MYSQL__ = require('./mysql.base');
const __HELPER__ = require('../utility/helper');
const __STATEMENT__ = require('./platform.sql.statement');
const __USER_STATEMENT__ = require('./user.sql.statement');
// const __MOMENT__ = require('moment');
// const __LOGGER__ = require('../services/log4js.service').getLogger('platform.api.js');

/**
 * 添加授权方
 * @param request
 * @returns {*|C|promise}
 */
function addAuthorizer(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            /**
             *  1. 判断该自媒体或者商家是否已授权过
             */
            isRepeatSQL: __STATEMENT__.__CHECK_AUTHORIZER__,
            isRepeatParams: [
                request.appid
            ],
            /**
             *  2. 未授权过，新增
             *     否则，更新
             */
            basicInsertSQL: __STATEMENT__.__ADD_AUTHORIZER__,
            basicInsertParams: [{
                appid: request.appid,
                accessToken: request.accessToken,
                expiresIn: request.expiresIn,
                refreshToken: request.refreshToken,
                funcInfo: request.funcInfo
            }],
            basicUpdateSQL: __STATEMENT__.__REFRESH_AUTHORIZER__,
            basicUpdateParams: [
                request.accessToken,
                request.expiresIn,
                request.refreshToken,
                request.funcInfo,
                request.appid
            ]
        })
        .then(__MYSQL__.beginTransaction)
        .then(__MYSQL__.isRepeat)
        .then(
            __MYSQL__.basicInsert,
            __MYSQL__.basicUpdate
        )
        .then(__MYSQL__.commitTransaction)
        .then(__MYSQL__.cleanup)
        .then(() => {
            deferred.resolve(request);      //  透传参数
        })
        .catch(function (request) {
            __MYSQL__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}


function authorizerAndUser(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            basicInsertSQL: __STATEMENT__.__ADD_REL_AUTHORIZER_USER__,
            basicInsertParams: [
                request.appid,
                request.session
            ]
        })
        .then(__MYSQL__.beginTransaction)
        .then(__MYSQL__.basicInsert)
        .then(__MYSQL__.commitTransaction)
        .then(__MYSQL__.cleanup)
        .then(() => {
            deferred.resolve(request);      //  透传参数
        })
        .catch(function (request) {
            __MYSQL__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 * 通过开放平台登录
 *  --  网站
 *  --  第三方平台
 * @param request
 * @returns {*|promise|C}
 */
function wechatOpenPlatformLogin(request) {
    const deferred = Q.defer();
    const nonceStr = __HELPER__.getNonceStr(32);

    __MYSQL__
        .setUpConnection({
            /**
             *  1. 根据 openid 查询用户是否存在
             */
            isRepeatSQL: __USER_STATEMENT__.__IS_OPENID_REPEAT__,
            isRepeatParams: [
                request.openid
            ],
            /**
             *  2.1 如果不存在，新增
             */
            basicInsertSQL: __USER_STATEMENT__.__ADD_USER__,
            basicInsertParams: [{
                'appid': request.appid,
                'openid': request.openid,
                '3rd_session': nonceStr,
                'role': request.role,
                'expires_in': request.expiresIn
            }],
            /**
             *  2.2 如果存在，更新用户表
             */
            basicUpdateSQL: __USER_STATEMENT__.__UPDATE_USER__,
            basicUpdateParams: [
                {
                    'appid': request.appid,
                    '3rd_session': nonceStr,
                    'role': request.role,
                    'expires_in': request.expiresIn
                },
                request.openid
            ]
        })
        .then(__MYSQL__.beginTransaction)               //  启动事务
        .then(__MYSQL__.isRepeat)                       //  openid 是否已存在
        .then(
            __MYSQL__.basicInsert,                      //  不存在，新增
            __MYSQL__.basicUpdate                       //  存在，更新
        )
        .then(__MYSQL__.commitTransaction)              //  提交事务
        .then(__MYSQL__.cleanup)                        //  清理
        .then(function () {
            // request.nonceStr = nonceStr;                  //  记录自定义登录态
            deferred.resolve(nonceStr);                      //  回传
        })
        .catch(function (request) {
            __MYSQL__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 * 获取授权方的 access token
 * @param request
 * @returns {*|promise|C}
 */
function fetchAuthorizerAccessToken(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            /**
             *  1. 根据 openid 查询用户是否存在
             */
            basicQuerySQL: __STATEMENT__.__FETCH_AUTHORIZER_ACCESS_TOKEN__,
            basicQueryParams: [
                request.appid
            ]
        })
        .then(__MYSQL__.basicQuery)
        .then(__MYSQL__.cleanup)
        .then(result => {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL__.onReject(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 * 由公众号管理员的微信号查询其所绑定的公众号 appid
 * @param request
 * @returns {*}
 */
function fetchAuthroizerInfo(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            basicQuerySQL: __STATEMENT__.__FETCH_AUTHORIZER_INFO__,
            basicQueryParams: [
                request.session
            ]
        })
        .then(__MYSQL__.basicQuery)
        .then(__MYSQL__.cleanup)
        .then(result => {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL__.onReject(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;

}

module.exports = {
    addAuthorizer: addAuthorizer,
    authorizerAndUser: authorizerAndUser,
    wechatOpenPlatformLogin: wechatOpenPlatformLogin,
    fetchAuthorizerAccessToken: fetchAuthorizerAccessToken,
    fetchAuthroizerInfo: fetchAuthroizerInfo
};

// addAuthorizer({});
