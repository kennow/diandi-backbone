/**
 *
 *    配置账号信息
 *
 */

const config = {
    /**
     * 第三方平台 APPID
     */
    __APP_ID__: 'wx4328d9d4893f7a2f',
    /**
     * APPSECRET：第三方平台secert
     */
    __APP_SECRET__: 'ea783e709620c74cb64a0e38e2135032',
    /**
     * 消息加解密Key
     */
    __SYMMETRIC_KEY__: '59GzZVS1kAZ0nc9MyDjziYh7qYhIZdvYQtoKUQ3pJ0i',
    /**
     * AES采用CBC模式，秘钥长度为32个字节（256位），数据采用PKCS#7填充
     */
    __ALGORITHM__: 'aes-256-cbc',
    /**
     * 微信开放平台上，服务方设置的接收消息的校验token
     */
    __TOKEN__: 'PUSU'

};

module.exports = config;