const Q = require('q');
const __MYSQL__ = require('./mysql.base');
const __SYSTEM_STATEMENT__ = require('./system.sql.statement');

/**
 * 短信发送成功后，记录下发送结果
 * @param request
 * @returns {*|C|promise}
 */
function addSMS(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            basicInsertSQL: __SYSTEM_STATEMENT__.__ADD_SMS__,
            basicInsertParams: [{
                requestId: request.requestId,
                bizId: request.bizId,
                phone: request.phone,
                verificationCode: request.verificationCode,
                errCode: request.errCode
            }]
        })
        .then(__MYSQL__.beginTransaction)
        .then(__MYSQL__.basicInsert)
        .then(__MYSQL__.commitTransaction)
        .then(__MYSQL__.cleanup)
        .then(() => {
            deferred.resolve({
                requestId: request.requestId,
                bizId: request.bizId
            });
        })
        .catch(function (request) {
            __MYSQL__.onRejectWithRollback(request, function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

/**
 * 校验短信验证码
 * @param request
 * @returns {*|C|promise}
 */
function checkSMS(request) {
    const deferred = Q.defer();

    __MYSQL__
        .setUpConnection({
            checkSMSSQL: __SYSTEM_STATEMENT__.__CHECK_SMS__,
            checkSMSParams: [
                request.requestId,
                request.bizId,
                request.phone,
                request.verificationCode
            ]
        })
        .then(__MYSQL__.checkSMS)
        .then(__MYSQL__.cleanup)
        .then(function (result) {
            deferred.resolve(result);
        })
        .catch(function (request) {
            __MYSQL__.onReject(request, function (response) {
                deferred.reject(response);
            });
        });

    return deferred.promise;
}

module.exports = {
    addSMS: addSMS,
    checkSMS: checkSMS
};
