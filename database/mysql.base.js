const Q = require('q');
const __MYSQL__ = require('mysql');
const __MYSQL_CONFIG__ = require('./mysql.config');
const __LOGGER__ = require('../services/log4js.service').getLogger('mysql.api.js');
const __ERROR__ = require('../utility/error.code');

let api =
    {
        // 使用mysql.config.js的配置信息创建一个MySQL连接池
        pool: __MYSQL__.createPool(__MYSQL_CONFIG__.mysql),

        commonHandler: function (deferred, request, err, result) {
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
        },

        /**
         *  抽象isRepeat的回调处理逻辑
         * @param request
         * @param deferred
         * @param err
         * @param result
         */
        isRepeatHandler: function (request, deferred, err, result) {
            __LOGGER__.info('==> isRepeat ==> callback | ' + err);
            if (err) {
                deferred.reject({
                    connection: request.connection,
                    params: request.params,
                    code: __ERROR__.failed,
                    errMsg: err
                });
            } else {
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
        },

        /**
         * 建立连接
         * @param parameters
         * @returns {*|Promise|promise}
         */
        setUpConnection: function (parameters) {
            const deferred = Q.defer();

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
            const deferred = Q.defer();

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
            const deferred = Q.defer();
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
            const deferred = Q.defer();
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
         *  检查目标项是否存在
         *  -   如果不存在，正常执行后续流程
         *  -   如果存在，reject
         * @param request
         * @returns {*|promise}
         */
        isRepeat: function (request) {
            const deferred = Q.defer();

            request.connection.query(request.params.isRepeatSQL, request.params.isRepeatParams, function (err, result) {
                api.isRepeatHandler(request, deferred, err, result);
            });

            return deferred.promise;
        },

        /**
         * 批量执行时调用
         * @param request
         * @returns {*|promise}
         */
        isRepeatPlus: function (request) {
            const deferred = Q.defer();

            request.connection.query(
                request.params.isRepeatSQL,
                request.params.isRepeatParams[request.params.oneStepIndex],
                function (err, result) {
                    api.isRepeatHandler(request, deferred, err, result);
                });

            return deferred.promise;
        },


        /**
         * 插入
         * @param request
         * @returns {*|promise}
         */
        basicInsert: function (request) {
            const deferred = Q.defer();

            request.connection.query(request.params.basicInsertSQL, request.params.basicInsertParams, function (err, result) {
                __LOGGER__.info('==> basicInsert ==> callback |  ' + err);
                api.commonHandler(deferred, request, err, result);
            });

            return deferred.promise;
        },

        /**
         * 更新
         * @param request
         */
        basicUpdate: function (request) {
            const deferred = Q.defer();
            request.connection.query(request.params.basicUpdateSQL, request.params.basicUpdateParams, function (err, result) {
                __LOGGER__.info('==> basicUpdate ==> callback |  ' + err);
                api.commonHandler(deferred, request, err, result);
            });

            return deferred.promise;
        },

        /**
         * 删除
         * @param request
         * @returns {*|promise}
         */
        basicDelete: function (request) {
            const deferred = Q.defer();

            request.connection.query(request.params.deleteSQL, request.params.deleteParams, function (err, result) {
                __LOGGER__.info('==> basicDelete ==> callback |  ' + err);
                api.commonHandler(deferred, request, err, result);
            });

            return deferred.promise;
        },

        /**
         * 基础查询
         * @param request
         * @returns {*|promise}
         */
        basicQuery: function (request) {
            const deferred = Q.defer();

            request.connection.query(request.params.basicQuerySQL, request.params.basicQueryParams, function (err, result) {
                __LOGGER__.info('==> basicQuery ==> callback |  ' + err);
                api.commonHandler(deferred, request, err, result);
            });

            return deferred.promise;
        },

        /**
         * 批量查询
         * @param request
         */
        batchQuery: function (request) {
            const deferred = Q.defer();

            __LOGGER__.debug(request.params.batchQuerySQL[request.params.batchQueryIndex]);
            __LOGGER__.debug(request.params.batchQueryParams[request.params.batchQueryIndex]);
            request.connection.query(
                request.params.batchQuerySQL[request.params.batchQueryIndex],
                request.params.batchQueryParams[request.params.batchQueryIndex],
                function (err, result) {
                    __LOGGER__.info('==> batchQuery ==> callback |  ' + err);
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(result);
                    }
                });

            return deferred.promise;
        },

        // 启动批量查询
        inAll: function (request) {
            let i, length, tasks = [], deferred = Q.defer();
            //  将查询语句放入执行队列
            //  由于Q.all异步启动所有任务，在放入队列前，要确认执行的语句及其参数
            for (i = 0, length = request.params.batchQuerySQL.length; i < length; i++) {
                tasks.push(api.batchQuery(request));
                request.params.batchQueryIndex = request.params.batchQueryIndex + 1;
            }

            Q.all(tasks)
            // 所有任务执行结束后，对返回结果进行修饰
                .then(function (rawData) {
                    let j, result = {};
                    // 为按顺序返回的各个结果集添加标签
                    //__LOGGER__.debug(rawData);
                    for (j = 0; j < rawData.length; j++) {
                        result[request.params.batchQueryTag[j]] = rawData[j];
                    }
                    deferred.resolve({
                        connection: request.connection,
                        params: request.params,
                        result: result
                    });
                })
                .catch(function (exception) {
                    __LOGGER__.error(exception);
                    deferred.reject({
                        connection: request.connection,
                        params: request.params,
                        code: __ERROR__.failed,
                        errMsg: exception
                    });
                });

            return deferred.promise;
        },

        /**
         * 检测登录态
         * @param request
         * @returns {*|promise}
         */
        checkSession: function (request) {
            return api.isExistHandler(request, request.params.checkSessionSQL, request.params.checkSessionParams, '账户已失效，请重新登录！');
        },

        /**
         * 检查用户权限
         * @param request
         * @returns {*}
         */
        checkPermission: function (request) {
            return api.isExistHandler(request, request.params.checkPermissionSQL, request.params.checkPermissionParams, '您没有权限！');
        },

        /**
         * 检查短信验证码
         * @param request
         * @returns {*}
         */
        checkSMS: function (request) {
            return api.isExistHandler(request, request.params.checkSMSSQL, request.params.checkSMSParams, '请输入正确的验证码！');
        },

        /**
         * 检查退款订单状态
         * @param request
         * @returns {*}
         */
        checkRefundStatus: function (request) {
            return api.isExistHandler(request, request.params.checkRefundStatusSQL, request.params.checkRefundStatusParams, '请勿重复提交退款申请！');
        },

        /**
         * 检查 openid 是否前后一致
         * @param request
         * @returns {*}
         */
        checkOpenIDConsistency: function (request) {
            return api.isExistHandler(request, request.params.checkOpenIDConsistencySQL, request.params.checkOpenIDConsistencyParams, '领取卡券与支付订单所使用的账户不一致！');
        },

        /**
         *
         * @param request
         * @param sql
         * @param params
         * @param hint
         * @returns {*}
         */
        isExistHandler: function (request, sql, params, hint) {
            const deferred = Q.defer();

            request.connection.query(sql, params, function (err, result) {
                __LOGGER__.info('==> isExistHandler ==> callback | ' + err);

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
                            errMsg: hint
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
         * 检查库存
         * @param request
         * @returns {*|promise}
         */
        checkStock: function (request) {
            const deferred = Q.defer();

            request.connection.query(
                request.params.checkStockSQL,
                request.params.checkStockParams[request.params.oneStepIndex],
                function (err, result) {
                    __LOGGER__.info('==> checkStock ==> callback | ' + err);
                    if (err) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.failed,
                            errMsg: err
                        });
                    } else {
                        if (result.length === 0 || result[0].stock < request.params.checkStockAmount[request.params.oneStepIndex]) {
                            deferred.reject({
                                connection: request.connection,
                                params: request.params,
                                code: __ERROR__.outOfStockError,
                                errMsg: '库存不足！'
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
         * 从上一次执行语句返回的结果中，找到对应属性，并修改请求参数
         * @param request
         * @returns {*|promise}
         */
        modifyRequestParams: function (request) {
            const deferred = Q.defer();
            let params = request.params;
            //  检测属性是否存在
            if (params.hasOwnProperty(params.modifyParamsKey)
                && params[params.modifyParamsKey][0].hasOwnProperty(params.modifyParamsAttribute)
                && request.result.hasOwnProperty(params.resultKey)) {
                params[params.modifyParamsKey][0][params.modifyParamsAttribute] = request.result[params.resultKey];
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
            const deferred = Q.defer();

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
            const deferred = Q.defer();

            __LOGGER__.debug(request.params.oneStepSQLs[request.params.oneStepIndex]);
            __LOGGER__.debug(request.params.oneStepParams[request.params.oneStepIndex]);
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
            let i,
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
        },

        /**
         * 附加
         * 一个执行单元包含两个流程
         * 1. 第一个流程作检查，判断是否重复
         * 2. 不存在再执行第二个流程
         * @param request
         * @returns {*}
         */
        executeInOrderPlus: function (request) {
            let i,
                length,
                promise,
                tasks = [];

            // 放进执行列表
            for (i = 0, length = request.params.oneStepSQLs.length; i < length; i++) {
                tasks.push(request.params.oneStepPlusFn);       //  额外添加的执行流程
                tasks.push(api.oneStep);                        //  执行添加
            }

            promise = Q(request);

            for (i = 0, length = tasks.length; i < length; i++) {
                promise = promise.then(tasks[i]);
            }

            return promise;
        },

        /**
         * 在 executeInOrderPlus 基础上改进
         * 1. 判断键值是否存在
         * 2. 不存在，索引在执行队列中的位置加 一
         * 3. 存在，索引在执行队列中的位置加 二
         * @param request
         * @returns {*|promise}
         */
        stepX: function (request) {
            const deferred = Q.defer();

            __LOGGER__.info('执行第' + (request.params.xStepIndex + 1) + '条命令');
            __LOGGER__.info(request.params.xStepSQLs[request.params.xStepIndex]);
            __LOGGER__.info(request.params.xStepParams[request.params.xStepIndex]);
            request.connection.query(
                request.params.xStepSQLs[request.params.xStepIndex],
                request.params.xStepParams[request.params.xStepIndex],
                function (err, result) {
                    __LOGGER__.info('==> stepX ==> callback | ' + err);
                    __LOGGER__.debug(result);
                    if (result.length === 0 || result[0].number === 0) {
                        request.params.xStepIndex = request.params.xStepIndex + 1;
                        deferred.resolve({
                            connection: request.connection,
                            params: request.params,
                            result: result[0]
                        });
                    } else {
                        request.params.xStepIndex = request.params.xStepIndex + 2;
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            result: result[0]
                        });
                    }
                });

            return deferred.promise;
        },

        /**
         * 对应stepX 中目标值不存在的执行逻辑
         * 1. 如果执行过程未发生异常，将索引在执行队列中的位置加 二，回到判断逻辑
         * 2. 发生异常
         * @param request
         * @returns {*|promise}
         */
        notExistHandler: function (request) {
            const deferred = Q.defer();

            request.connection.query(
                request.params.xStepSQLs[request.params.xStepIndex],
                request.params.xStepParams[request.params.xStepIndex],
                function (err, result) {
                    __LOGGER__.info('==> notExistHandler ==> callback |  ' + err);
                    if (err) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.failed,
                            errMsg: err
                        });
                    } else {
                        request.params.xStepIndex = request.params.xStepIndex + 2;
                        request.result = result;
                        deferred.resolve(request);
                    }
                });

            return deferred.promise;
        },

        /**
         * 对应stepX 中目标值已存在的执行逻辑
         * 1. 如果执行过程未发生异常，将索引在执行队列中的位置加 一，回到判断逻辑
         * 2. 发生异常
         * @param request
         * @returns {*|promise}
         */
        existHandler: function (request) {
            const deferred = Q.defer();

            request.connection.query(
                request.params.xStepSQLs[request.params.xStepIndex],
                request.params.xStepParams[request.params.xStepIndex],
                function (err, result) {
                    __LOGGER__.info('==> existHandler ==> callback |  ' + err);
                    if (err) {
                        deferred.reject({
                            connection: request.connection,
                            params: request.params,
                            code: __ERROR__.failed,
                            errMsg: err
                        });
                    } else {
                        request.params.xStepIndex = request.params.xStepIndex + 1;
                        request.result = result;
                        deferred.resolve(request);
                    }
                });

            return deferred.promise;
        },

        /**
         * 统筹
         * @param request
         * @returns {*}
         */
        executeStepX: function (request) {
            let i,
                promise,
                tasks = [];

            // 放进执行列表
            for (i = 0; i < request.params.xStepCount; i++) {
                tasks.push(api.stepX);                  //  检查属性值是否重复
                tasks.push(api.notExistHandler);        //  不存在的处理逻辑
                tasks.push(api.existHandler);           //  存在的处理逻辑
            }

            promise = Q(request);

            for (i = 0; i < tasks.length; i += 3) {
                // 根据第一个流程的执行结果，决定后续的执行顺序
                promise = promise.then(tasks[i]);
                promise = promise.then(tasks[i + 1], tasks[i + 2]);
            }

            // TODO:  当在执行过程中发生异常时，跳过队列中剩下的任务

            return promise;
        },

        /**
         *  统筹工作并加上扫尾
         * @param request
         * @returns {*}
         */
        executeStepXWithMopUp: function (request) {
            let i,
                promise,
                tasks = [];

            // 放进执行列表
            for (i = 0; i < request.params.xStepCount; i++) {
                tasks.push(api.stepX);                  //  检查属性值是否重复
                tasks.push(api.notExistHandler);        //  不存在的处理逻辑
                tasks.push(api.existHandler);           //  存在的处理逻辑
                tasks.push(request.params.mopUpFn);     //  扫尾
            }

            promise = Q(request);

            for (i = 0; i < tasks.length; i += 4) {
                // 根据第一个流程的执行结果，决定后续的执行顺序
                promise = promise.then(tasks[i]);
                promise = promise.then(tasks[i + 1], tasks[i + 2]);
                // 扫尾工作
                promise = promise.then(tasks[i + 3]);
            }

            return promise;
        }

        // In the end
    };

module.exports = api;