const Q = require('q');
const __XML_PARSER__ = require('xml2js').parseString;
const __CONFIG__ = require('./wechat.open.platform.config');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.open.platform.structure.js');

/**
 * 解析收到的含component_verify_ticket消息体
 *
 * 出于安全考虑，在第三方平台创建审核通过后，微信服务器 每隔10分钟会向第三方的消息接收地址推送一次component_verify_ticket
 * 用于获取第三方平台接口调用凭据。
 * @param request
 * @returns {*}
 */
function parseComponentVerifyTicket(request) {
    const deferred = Q.defer();

    __XML_PARSER__(request, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            __LOGGER__.debug(result);
            let data = {
                appId: result.xml.AppId[0],
                createTime: parseInt(result.xml.CreateTime[0]),
                infoType: result.xml.InfoType[0]
            };

            switch (data.infoType) {
                case 'component_verify_ticket':
                    data.componentVerifyTicket = result.xml.ComponentVerifyTicket[0];
                    break;
                case 'updateauthorized':
                    data.authorizerAppid = result.xml.AuthorizerAppid[0];
                    data.authorizationCode = result.xml.AuthorizationCode[0];
                    data.authorizationCodeExpiredTime = result.xml.AuthorizationCodeExpiredTime[0];
                    data.preAuthCode = result.xml.PreAuthCode[0];
                    break;
                default:
                    break;
            }
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

/**
 * 获取第三方平台component_access_token
 * @param request
 * @returns {{component_appid: string, component_appsecret: string, component_verify_ticket: *}}
 */
function constructComponentTokenParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        component_appsecret: request.component_appsecret || __CONFIG__.__APP_SECRET__,
        component_verify_ticket: request.componentVerifyTicket
    };
}

/**
 * 获取预授权码pre_auth_code
 * @param request
 * @returns {{component_appid: *}}
 */
function constructPreAuthCodeParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__
    };
}

/**
 * 使用授权码换取公众号或小程序的接口调用凭据和授权信息
 * @param request
 * @returns {{component_appid: string, authorization_code: *}}
 */
function constructAuthorizationParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        authorization_code: request.authorization_code
    };
}

/**
 * 获取（刷新）授权公众号或小程序的接口调用凭据（令牌）
 * @param request
 * @returns {{component_appid: string, authorizer_appid: (*|string), authorizer_refresh_token: *}}
 */
function constructRefreshAuthorizerToken(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        authorizer_appid: request.authorizer_appid,
        authorizer_refresh_token: request.authorizer_refresh_token
    };
}

/**
 * 获取授权公众号或小程序基本信息
 * @param request
 * @returns {{component_appid: string, authorizer_appid: (*|string)}}
 */
function constructAuthorizerInfoParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        authorizer_appid: request.authorizer_appid
    };
}

/**
 * 获取授权方的选项设置信息
 * @param request
 * @returns {{component_appid: string, authorizer_appid: (*|string), option_name: *}}
 */
function constructGetAuthorizerOptionParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        authorizer_appid: request.authorizer_appid,
        option_name: request.option_name
    };
}

/**
 * 设置授权方的选项信息
 * @param request
 * @returns {{component_appid: string, authorizer_appid: (*|string), option_name: *, option_value: *}}
 */
function constructSetAuthorizerOptionParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        authorizer_appid: request.authorizer_appid,
        option_name: request.option_name,
        option_value: request.option_value
    };
}

/**
 * 第三方平台对其所有API调用次数清零
 * @param request
 * @returns {{component_appid: string}}
 */
function constructClearComponentQuotaParams(request) {
    return {
        component_appid: request.component_appid || __CONFIG__.__APP_ID__
    };
}

/**
 * 通过code换取access_token
 * @param request
 * @returns {{appid: *, code, grant_type: string, component_appid: string, component_access_token: *}}
 */
function constructAuthorizerAccessTokenParams(request) {
    return {
        //  公众号的appid
        appid: request.appid,
        //  填写第一步获取的code参数
        code: request.code,
        //  填authorization_code
        grant_type: 'authorization_code',
        //  服务开发方的appid
        component_appid: request.component_appid || __CONFIG__.__APP_ID__,
        //  服务开发方的access_token
        component_access_token: request.component_access_token
    };
}

module.exports = {
    parseComponentVerifyTicket: parseComponentVerifyTicket,
    constructComponentTokenParams: constructComponentTokenParams,
    constructPreAuthCodeParams: constructPreAuthCodeParams,
    constructAuthorizationParams: constructAuthorizationParams,
    constructRefreshAuthorizerToken: constructRefreshAuthorizerToken,
    constructAuthorizerInfoParams: constructAuthorizerInfoParams,
    constructGetAuthorizerOptionParams: constructGetAuthorizerOptionParams,
    constructSetAuthorizerOptionParams: constructSetAuthorizerOptionParams,
    constructClearComponentQuotaParams: constructClearComponentQuotaParams,
    constructAuthorizerAccessTokenParams: constructAuthorizerAccessTokenParams
};