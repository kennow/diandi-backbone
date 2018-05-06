const Q = require('q');
const __MYSQL__ = require('mysql');
const __MYSQL_CONFIG__ = require('./mysql.config');
const __LOGGER__ = require("../services/log4js.service").getLogger("mysql.api.js");
const __ERROR__ = require("../utility/error.code");

var api =
    {
        // 使用mysql.config.js的配置信息创建一个MySQL连接池
        pool: __MYSQL__.createPool(__MYSQL_CONFIG__.mysql),

        /**
         * 建立连接
         * @param parameters
         * @returns {*|Promise|promise}
         */
        setUpConnection: function (parameters) {
            var deferred = Q.defer();
            // 从连接池获取连接
            this.pool.getConnection(function (err, connection) {
                __LOGGER__.info("==> setUpConnection ==> callback | " + err);
                if (err) {
                    deferred.reject({
                        connection: connection,
                        code: __ERROR__.databaseConnectError,
                        errMsg: err
                    });
                } else {
                    deferred.resolve({
                        connection: connection,
                        params: parameters
                    });
                }
            });

            return deferred.promise;
        },

        /**
         * 启动事务
         * @param request
         * @returns {*|Promise|promise}
         */
        beginTransaction: function (request) {
            var deferred = Q.defer();
            // 启动事务
            request.connection.beginTransaction(function (err) {
                __LOGGER__.info("==> beginTransaction ==> callback |  " + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    deferred.resolve(request);
                }
            });

            return deferred.promise;
        },

        /**
         * 提交事务
         * @param request
         * @returns {*|Promise|promise}
         */
        commitTransaction: function (request) {
            var deferred = Q.defer();
            // 提交事务
            request.connection.commit(function (err) {
                __LOGGER__.info("==> commitTransaction ==> callback |  " + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    deferred.resolve(request);
                }
            });

            return deferred.promise;
        },

        /**
         * 扫尾 - 释放连接
         * @param request
         * @returns {*|Promise|promise}
         */
        cleanup: function (request) {
            var deferred = Q.defer();
            // 释放连接
            __LOGGER__.info("==>   cleanup");
            request.connection.release();
            deferred.resolve({
                code: __ERROR__.success,
                msg: request.result
            });

            return deferred.promise;
        },

        /**
         * 错误处理
         * 如果不释放链接，当连接数达connectionLimit后，会无法获取新链接，而发生死锁
         * @param request
         * @param response
         */
        onReject: function (request, response) {
            __LOGGER__.info("==>   onReject");
            if (request.hasOwnProperty('connection')) {
                request.connection.release();
                response({
                    code: request.code,
                    msg: request.errMsg
                });
            } else {
                response({
                    code: __ERROR__.unknownError,
                    msg: '发生未知错误'
                });
            }
        }
        ,

        /**
         * 错误处理
         *  - 带事务回滚
         * @param request
         * @param response
         */
        onRejectWithRollback: function (request, response) {
            __LOGGER__.info("==>   onRejectWithRollback");
            if (request.hasOwnProperty('connection')) {
                request.connection.rollback(function () {
                    __LOGGER__.info("==>   onRejectWithRollback    ==>     rollback");
                    request.connection.release();
                });
                response({
                    code: request.code,
                    msg: request.errMsg
                });
            } else {
                response({
                    code: __ERROR__.unknownError,
                    msg: '发生未知错误'
                });
            }
        }

        // In the end
    }
;

module.exports = api;