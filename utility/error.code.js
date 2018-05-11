module.exports = {
    /**
     * 成功
     */
    success: 0,
    /**
     * 执行任务失败
     */
    failed: -100,
    /**
     * 数据库连接失败
     */
    databaseConnectError: -200,
    /**
     * 短信校验失败
     */
    smsCheckError: -300,
    /**
     * 查询结果不存在
     */
    notFoundError: -400,
    /**
     * 重复提交
     */
    resubmitError: -500,
    /**
     * 出现未知错误
     */
    unknownError: -600,
    /**
     * 预支付结果签名验证错误
     */
    checkSignError: -700,
    /**
     * 登录态失效
     */
    loginStatusError: -800
};
