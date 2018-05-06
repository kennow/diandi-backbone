const __UTIL__ = require('util');
const __CRYPTO__ = require('crypto');

/**
 *
 *      按字典序排序参数
 *
 *  设所有发送或者接收到的数据为集合M
 *  将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（字典序）
 *  使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA
 *  参数名ASCII码从小到大排序（字典序）
 *  如果参数的值为空不参与签名；
 *  参数名区分大小写；
 *  验证调用返回或微信主动通知签名时，传送的sign参数不参与签名，将生成的签名与该sign值作校验。
 *  微信接口可能增加字段，验证签名时必须支持增加的扩展字段
 * @param args
 * @returns {string}
 */
function convertToUrlParams(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = args[key];
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
}

/**
 * 设置签名
 * 并对convertToUrlParams生成的String进行MD5运算，
 * 再将得到的字符串所有字符转换为大写，得到sign值signValue
 * @param args
 * @param key
 * @returns {string}
 */
function makeSign(args, key) {
    var string = convertToUrlParams(args);
    string = string + '&key=' + key;

    var sign = __CRYPTO__.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase();
}

/**
 * 转换为XML
 * 生成Post方式的Https的携带参数
 * @param args
 * @returns {string}
 */
function convertToXml(args) {
    var postData = '<xml>';

    for (var key in args) {
        postData += __UTIL__.format('<%s>%s</%s>', key, args[key], key);
    }
    postData += '</xml>';

    return postData;
}

module.exports = {
    convertToUrlParams: convertToUrlParams,
    makeSign: makeSign,
    convertToXml: convertToXml
};
