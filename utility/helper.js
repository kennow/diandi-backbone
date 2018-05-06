/**
 * 产生随机字符串
 * @param length
 * @returns {string}
 */
function getNonceStr(length) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const count = chars.length;
    var i, nonceStr = "";
    for (i = 0; i < length; i++) {
        nonceStr += chars.substr(Math.floor(Math.random() * (count - 1) + 1), 1);
    }
    return nonceStr;
}

/**
 * 标准北京时间，时区为东八区，自1970年1月1日 0点0分0秒以来的秒数。
 * 注意：部分系统取到的值为毫秒级，需要转换成秒(10位数字)
 * @returns {string}
 */
function getTimestamp() {
    return parseInt(new Date().getTime() / 1000) + '';
}

module.exports = {
    getNonceStr: getNonceStr,
    getTimestamp: getTimestamp
};
