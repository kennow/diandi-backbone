const Q = require('q');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require("../log4js.service").getLogger("credential.service.js");

/**
 * 微信小程序
 *  --  莆素
 *      --  AppID
 *      --  AppSecret
 *  -- openId 请求链接
 */
const __APP_ID_MINI_PROGRAM__ = "wx0a72bd7d41e0b066";
const __APP_SECRET_MINI_PROGRAM__ = "32e38063345fe06194fd59c970fde966";
/**
 * 微信小程序
 *  --  萌小娃
 *      --  AppID
 *      --  AppSecret
 *  -- openId 请求链接
 */
//const __APP_ID_MINI_PROGRAM__ = "wx552f609c3ae06a00";
//const __APP_SECRET_MINI_PROGRAM__ = "990271bddff2e955ff1a56a26fe25319";

const __REQ_OPENID_API__ = "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

/**
 * 微信小程序
 */
function fetchUserOpenId(code, response) {
    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__REQ_OPENID_API__, __APP_ID_MINI_PROGRAM__, __APP_SECRET_MINI_PROGRAM__, code),
            function (data) {
                response(JSON.parse(data));
            });
}

//fetchUserOpenId("0618fReq1PMAvq0Hrqfq1dDSeq18fReh", function (result) {
//    __LOGGER__.debug(result)
//});
