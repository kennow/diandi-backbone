const Q = require('q');
const __MYSQL_API__ = require('./mysql.api');
const __STATEMENT__ = require('./user.sql.statement');
const __HELPER__ = require('../utility/helper');

function wechatMiniProgramLogin(request) {
    const deferred = Q.defer();
    const nonceStr = __HELPER__.getNonceStr(32);

    __MYSQL_API__
        .setUpConnection({
            /**
             *  1. 根据 openid 查询用户是否存在
             */
            isRepeatSQL: __STATEMENT__.__IS_OPENID_REPEAT__,
            isRepeatParams: [
                request.openid
            ],
            /**
             *  2.1 如果不存在，新增
             */
            basicInsertSQL: __STATEMENT__.__ADD_MINI_PROGRAM_USER__,
            basicInsertParams: [{
                'openid': request.openid,
                'session_key': request.session_key,
                '3rd_session': nonceStr
            }],
            /**
             *  2.2 如果存在，更新用户表
             */
            basicUpdateSQL: __STATEMENT__.__UPDATE_MINI_PROGRAM_USER__,
            basicUpdateParams: [
                {
                    'openid': request.openid,
                    'session_key': request.session_key,
                    '3rd_session': nonceStr
                },
                request.openid
            ]
        })
        .then(__MYSQL_API__.beginTransaction)               //  启动事务
        .then(__MYSQL_API__.isRepeat)                       //  openid 是否已存在
        .then(
            __MYSQL_API__.basicInsert,                      //  不存在，新增
            __MYSQL_API__.basicUpdate                       //  存在，更新
        )
        .then(__MYSQL_API__.commitTransaction)              //  提交事务
        .then(__MYSQL_API__.cleanup)                        //  清理
        .then(function () {
            request.nonceStr = nonceStr;                    //  记录自定义登录态
            deferred.resolve(request);                      //  回传
        })
        .catch(function (request) {
            __MYSQL_API__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

module.exports = {
    wechatMiniProgramLogin: wechatMiniProgramLogin
};

// wechatMiniProgramLogin({
//     session_key: 'xyUjCiulVSjZJY0ozZ+76w==',
//     openid: 'oX9I95Tz_AOX-oAdgAIYvE0lYDjc'
// });