/**
 *
 *    配置账号信息
 *
 */

const config = {
    /**
     * 测试号信息
     */
    __APP_ID__: 'wx1133464776a7a161',
    __APP_SECRET__: 'c3eceda5d7c37f7fd74b7f5da2638638',
    /**
     * 花管家
     */
    // __APP_ID__: 'wx7770629fee66dd93',
    // __APP_SECRET__: 'b78783f2143e19a476d7df073fe12e89',
    /**
     * 请求接口
     */
    __API__: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s'

};

module.exports = config;