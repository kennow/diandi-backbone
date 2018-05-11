/**
 *
 *    配置账号信息
 *
 */

var config = {

    //=======【基本信息设置】=====================================

    /**
     * APPID：绑定支付的APPID（必须配置，开户邮件中可查看）
     */
    __APP_ID__: 'wxc91180e424549fbf',
    /**
     * APPSECRET：公众帐号secert（仅JSAPI支付的时候需要配置， 登录公众平台，进入开发者中心可设置）
     * 获取地址：https://mp.weixin.qq.com/advanced/advanced?action=dev&t=advanced/dev&token=2005451881&lang=zh_CN
     */
    // __APP_SECRET__: 'e6a2dd10d7062b36bd8d73bd077b0edd',
    /**
     * MCHID：微信支付商户号（必须配置，开户邮件中可查看）
     */
    __MCH_ID__: '1329741401',
    /**
     * KEY：商户支付密钥，参考开户邮件设置（必须配置，登录商户平台自行设置）
     * 设置地址：https://pay.weixin.qq.com/index.php/account/api_cert
     */
    __KEY__: '1u7blt3a6qlwjf1xg2d9cnsiiiewr95g',
    /**
     * 回传通知地址
     */
    __NOTIFY_URL__: 'https://www.thinmelon.cc:3000/shopping/wechat_pay/notification',

    //=======【证书路径设置】=====================================

    /**
     * TODO：设置商户证书路径
     * 证书路径,注意应该填写绝对路径（仅退款、撤销订单时需要，可登录商户平台下载）
     * API证书下载地址：https://pay.weixin.qq.com/index.php/account/api_cert，下载之前需要安装商户操作证书）
     */
    __SSL_CERT_PATH__: 'apiclient_cert.pem',
    __SSL_KEY_PATH__: 'apiclient_key.pem',
    __SSL_CA_PATH__: 'rootca.pem',

    //=======【接口参数设置】=====================================

    /**
     * APP和网页支付提交用户端ip
     * 默认为调用微信支付API的机器IP
     */
    __SPBILL_CREATE_IP__: '106.14.154.220',
    /**
     * 账单类型
     */
    __BILL_TYPE__: {
        ALL: 'ALL',                             //返回当日所有订单信息，默认值
        SUCCESS: 'SUCCESS',                     //返回当日成功支付的订单
        REFUND: 'REFUND',                       //返回当日退款订单
        RECHARGE_REFUND: 'RECHARGE_REFUND'      //返回当日充值退款订单（相比其他对账单多一栏“返还手续费”）
    }
};

module.exports = config;