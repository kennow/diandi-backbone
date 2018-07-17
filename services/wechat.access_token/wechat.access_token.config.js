/**
 *
 *    配置账号信息
 *
 */

const config = {
    /**
     * 测试号信息
     */
    // __APP_ID__: 'wx1133464776a7a161',
    // __APP_SECRET__: 'c3eceda5d7c37f7fd74b7f5da2638638',
    /**
     * 花管家
     */
    __APP_ID__: 'wx7770629fee66dd93',
    __APP_SECRET__: 'b78783f2143e19a476d7df073fe12e89',
    /**
     * 基础支持中的access_token
     * access_token（有效期7200秒，开发者必须在自己的服务全局缓存access_token）
     * 该access_token用于调用其他接口
     */
    __API_ACCESS_TOKEN__: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s',
    /**
     * jsapi_ticket（有效期7200秒，开发者必须在自己的服务全局缓存jsapi_ticket)）
     */
    __API_JSAPI_TICKET__: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=jsapi',
    /**
     * 此接口用于获取 Card API Ticket.
     */
    __API_CARD_TICKET__: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=wx_card'
};

module.exports = config;