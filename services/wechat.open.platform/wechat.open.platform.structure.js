const Q = require('q');
const __XML_PARSER__ = require('xml2js').parseString;

function parseComponentVerifyTicket(request) {
    const deferred = Q.defer();

    __XML_PARSER__(request, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            let data = {
                appId: result.xml.AppId[0],
                createTime: parseInt(result.xml.CreateTime[0]),
                infoType: result.xml.InfoType[0],
                componentVerifyTicket: result.xml.ComponentVerifyTicket[0] || ''
            };
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * 获取预授权码pre_auth_code
 * @param request
 * @returns {{component_appid: *}}
 */
function constructCreatePreAuthCodeParams(request) {
    return {
        component_appid: request.component_appid
    };
}

module.exports = {
    parseComponentVerifyTicket: parseComponentVerifyTicket,
    constructCreatePreAuthCodeParams: constructCreatePreAuthCodeParams
};