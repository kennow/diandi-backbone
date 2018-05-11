const Q = require('q');
const __MYSQL__ = require('mysql');
const __MYSQL_CONFIG__ = require('./mysql.config');
const __LOGGER__ = require('../services/log4js.service').getLogger('mysql.api.js');
const __ERROR__ = require('../utility/error.code');

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
                __LOGGER__.info('==> setUpConnection ==> callback | ' + err);
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
                __LOGGER__.info('==> beginTransaction ==> callback |  ' + err);
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
                __LOGGER__.info('==> commitTransaction ==> callback |  ' + err);
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
            __LOGGER__.info('==>   cleanup');
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
            __LOGGER__.info('==>   onReject');
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
            __LOGGER__.info('==>   onRejectWithRollback');
            if (request.hasOwnProperty('connection')) {
                request.connection.rollback(function () {
                    __LOGGER__.info('==>   onRejectWithRollback    ==>     rollback');
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
        },

        /**
         * 检查目标项是否存在
         *  -   如果不存在，正常执行后续流程
         *  -   如果存在，reject
         * @param request
         * @returns {*|promise}
         */
        isRepeat: function (request) {
            var deferred = Q.defer();

            request.connection.query(request.params.isRepeatSQL, request.params.isRepeatParams, function (err, result) {
                __LOGGER__.info('==> isRepeat ==> callback | ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    __LOGGER__.debug(result);
                    if (result.length === 0 || result[0].number === 0) {
                        deferred.resolve({
                            connection: request.connection,
                            params: request.params,
                            result: result[0]
                        });
                    } else {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.resubmitError,
                            errMsg: '已存在，请确认是否重复提交.'
                        });
                    }
                }
            });

            return deferred.promise;
        },

        /**
         * 插入
         * @param request
         * @returns {*|promise}
         */
        basicInsert: function (request) {
            var deferred = Q.defer();

            request.connection.query(request.params.basicInsertSQL, request.params.basicInsertParams, function (err, result) {
                __LOGGER__.info('==> basicInsert ==> callback |  ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    deferred.resolve({
                        connection: request.connection,
                        params: request.params,
                        result: result
                    });
                }
            });

            return deferred.promise;
        },

        /**
         * 更新
         * @param request
         */
        basicUpdate: function (request) {
            var deferred = Q.defer();

            request.connection.query(request.params.basicUpdateSQL, request.params.basicUpdateParams, function (err, result) {
                __LOGGER__.info('==> basicUpdate ==> callback |  ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    deferred.resolve({
                        connection: request.connection,
                        params: request.params,
                        result: result
                    });
                }
            });

            return deferred.promise;
        },

        /**
         * 删除
         * @param request
         * @returns {*|promise}
         */
        basicDelete: function (request) {
            var deferred = Q.defer();

            request.connection.query(request.params.deleteSQL, request.params.deleteParams, function (err, result) {
                __LOGGER__.info('==> basicDelete ==> callback |  ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    deferred.resolve({
                        connection: request.connection,
                        params: request.params,
                        result: result
                    });
                }
            });

            return deferred.promise;
        },

        /**
         * 检测登录态
         * @param request
         * @returns {*|promise}
         */
        checkSession: function (request) {
            var deferred = Q.defer();

            request.connection.query(request.params.checkSessionSQL, request.params.checkSessionParams, function (err, result) {
                __LOGGER__.info('==> checkSession ==> callback | ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    __LOGGER__.debug(result);
                    if (result.length === 0 || result[0].number === 0) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.loginStatusError,
                            errMsg: '账户已失效，请重新登录！'
                        });
                    } else {
                        deferred.resolve({
                            connection: request.connection,
                            params: request.params
                        });
                    }
                }
            });

            return deferred.promise;
        },

        /**
         * 修改请求参数
         * @param request
         * @returns {*|promise}
         */
        modifyRequestParams: function (request) {
            var deferred = Q.defer();
            var params = request.params;
            //  检测属性是否存在
            if (params.hasOwnProperty(params.modifyParamsKey)
                && params[params.modifyParamsKey][0].hasOwnProperty(params.modifyParamsAttribute)) {
                params[params.modifyParamsKey][0][params.modifyParamsAttribute] = request.result.uid;
                deferred.resolve({
                    connection: request.connection,
                    params: request.params
                });
            } else {
                deferred.reject({
                    connection: request.connection,
                    params: request.params,
                    code: __ERROR__.failed,
                    errMsg: '未找到相关属性！'
                });
            }

            return deferred.promise;
        },

        /**
         * 单行查询
         * @param request
         * @returns {*|promise}
         */
        singleLineQuery: function (request) {
            var deferred = Q.defer();

            __LOGGER__.info('==>   singleLineQuery | execSQL: ' + request.params.singleLineQuerySQL);
            request.connection.query(request.params.singleLineQuerySQL, request.params.singleLineQueryParams, function (err, result) {
                __LOGGER__.info('==> singleLineQuery ==> callback |  ' + err);
                if (err) {
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: err
                    });
                } else {
                    if (result.length === 0) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.failed,
                            errMsg: '记录不存在！'
                        });
                    } else {
                        deferred.resolve({
                            connection: request.connection,
                            params: request.params,
                            result: result[0]
                        });
                    }
                }
            });

            return deferred.promise;
        },

        /**
         * 一步 - 正式
         * 在批量删除的基础上进行改进
         * 在执行SQL语句同时，遍历传入的参数
         * @param request
         * @returns {*|promise}
         */
        oneStep: function (request) {
            var deferred = Q.defer();

            request.connection.query(
                request.params.oneStepSQLs[request.params.oneStepIndex],
                request.params.oneStepParams[request.params.oneStepIndex],
                function (err, result) {
                    __LOGGER__.info('==> oneStep ==> callback |  ' + err);
                    if (err) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.failed,
                            errMsg: err
                        });
                    } else {
                        request.params.oneStepIndex = request.params.oneStepIndex + 1;
                        request.result = result;
                        deferred.resolve(request);
                    }
                });

            return deferred.promise;
        },

        /**
         * 依次执行execSQLs中的指令
         * 参数数组与SQL指令数组相对应
         * @param request
         * @returns {*}
         */
        executeInOrder: function (request) {
            var i,
                length,
                promise,
                tasks = [];

            // 放进执行列表
            for (i = 0, length = request.params.oneStepSQLs.length; i < length; i++) {
                tasks.push(api.oneStep);
            }

            promise = Q(request);

            for (i = 0, length = tasks.length; i < length; i++) {
                promise = promise.then(tasks[i]);
            }

            return promise;
        }

        // In the end
    };

module.exports = api;