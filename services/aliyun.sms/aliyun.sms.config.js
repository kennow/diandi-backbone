const config = {
    /**
     *  用户AccessKey
     */
    __ACCESS_KEY_ID__: 'LTAIomGtdIoXci1E',
    __ACCESS_KEY_SECRET__: 'GNfgGApvCSuNH4M9zmJX58JyvzGM10',
    /**
     *  短信API产品名
     */
    __PRODUCT_NAME__: 'Dysmsapi',
    /**
     *  短信API产品域名
     */
    __PRODUCT_DOMAIN__: 'dysmsapi.aliyuncs.com',
    /**
     * 没传默认为JSON，可选填值：XML
     */
    __FORMAT__: 'JSON',
    /**
     * 建议固定值：HMAC-SHA1
     */
    __SIGNATURE_METHOD__: 'HMAC-SHA1',
    /**
     * 建议固定值：1.0
     */
    __SIGNATURE_VERSION__: '1.0',

    /// 业务参数

    /**
     *  API的命名，固定值，如发送短信API的值为：SendSms
     */
    __ACTION__: 'SendSms',
    /**
     *  API的版本，固定值，如短信API的值为：2017-05-25
     */
    __VERSION__: '2017-05-25',
    /**
     *  API支持的RegionID，如短信API的值为：cn-hangzhou
     *  暂时不支持多Region
     */
    __PRODUCT_REGION__: 'cn-hangzhou',
    /**
     *  短信签名
     */
    __SMS_SIGN_NAME__: '阿里云短信测试专用',
    /**
     *  短信模版
     */
    __SMS_TEMPLATE_IDENTITY__: 'SMS_137705124',         //  身份验证验证码
    __SMS_TEMPLATE_LOGIN__: 'SMS_137705123',            //  登录确认验证码
    __SMS_TEMPLATE_LOGIN_EXCEPTION__: 'SMS_137705122',  //  登录异常验证码
    __SMS_TEMPLATE_REGISTER__: 'SMS_137705121',         //  用户注册验证码
    __SMS_TEMPLATE_CHANGE_PASSWORD__: 'SMS_137705120',  //  修改密码验证码
    __SMS_TEMPLATE_MODIFY_INFO__: 'SMS_137705119',      //  信息变更验证码
    /**
     *  验证码长度
     */
    __CODE_LENGTH__: 6
};

const params = {
    AccessKeyId: config.__ACCESS_KEY_ID__,
    AccessKeySecret: config.__ACCESS_KEY_SECRET__,
    Format: config.__FORMAT__,
    SignatureMethod: config.__SIGNATURE_METHOD__,
    SignatureVersion: config.__SIGNATURE_VERSION__,
    Action: config.__ACTION__,
    Version: config.__VERSION__,
    RegionId: config.__PRODUCT_REGION__
};

module.exports = {
    KEY: config,
    PARAMS: params
};