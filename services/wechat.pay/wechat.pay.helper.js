const Q = require('q');
const __UTIL__ = require('util');
const __CRYPTO__ = require('crypto');
const __MOMENT__ = require('moment')();
const __WX_PAY_CONFIG__ = require('./wechat.pay.config');
const __ERROR_CODE__ = require('../../utility/error.code');

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
        if (k === 'sign') {
            continue;
        }
        if (newArgs[k] === '') {
            continue;
        }
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
 * 校验签名
 * @param args
 * @returns {*|promise}
 */
function checkSign(args) {
    const deferred = Q.defer();

    if (args.return_code !== 'SUCCESS') {
        deferred.reject({
            return_code: args.return_code,
            return_msg: args.return_msg
        });
    }
    else if (makeSign(args, __WX_PAY_CONFIG__.__KEY__) !== args.sign) {
        deferred.reject({
            return_code: __ERROR_CODE__.checkSignError,
            return_msg: '预支付结果签名验证错误'
        });
    }
    else {
        deferred.resolve(args);
    }
    return deferred.promise;
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

/**
 * 随机生成与支付订单相关的编号
 * @returns {*}
 */
function generateRandomNO() {
    const chars = '0123456789';
    const count = chars.length;
    var i, nonceStr = '';
    for (i = 0; i < 8; i++) {
        nonceStr += chars.substr(Math.floor(Math.random() * (count - 1) + 1), 1);
    }
    return __UTIL__.format('%s%s%s', __WX_PAY_CONFIG__.__MCH_ID__, __MOMENT__.format('YYYYMMDDHHmmss'), nonceStr);
}

/**
 * 退款结果对重要的数据进行了加密，商户需要用商户秘钥进行解密后才能获得结果通知的内容
 * @param encryptedData
 * @param algorithm
 * @param iv
 * @returns {*}
 */
function decryptData(encryptedData, algorithm, iv) {
    var key, decipher, decoded;

    // 对商户key做md5，得到32位小写key*
    key = __CRYPTO__.createHash('md5').update(__WX_PAY_CONFIG__.__KEY__).digest('hex');
    // 对加密串做base64解码，得到新的加密串
    encryptedData = new Buffer(encryptedData, 'base64');

    try {
        // 用key*对加密串B做AES-256-ECB解密（PKCS7Padding）
        decipher = __CRYPTO__.createDecipheriv(algorithm, key, iv);
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true);
        decoded = decipher.update(encryptedData, 'binary', 'utf8');
        decoded += decipher.final('utf8');
    } catch (err) {
        throw new Error('Illegal Buffer');
    }

    return decoded;
}

module.exports = {
    convertToUrlParams: convertToUrlParams,
    makeSign: makeSign,
    checkSign: checkSign,
    convertToXml: convertToXml,
    generateRandomNO: generateRandomNO,
    decryptData: decryptData
};

// generateRandomNO();
// var encryptedData = 'vgSb3f/TCDy6wyPK6XwpQkrw5pwLOg7+qpGR5xsddVsdXHQi4esS3Hjt1S2ulD9m/E1PWf+iQ2Rv3uSvyJESaxBt54o4UhiOXKHyZf2IWUoILiAnD7b9+u7eXH7dFJXX4UKiYGA7jH0eqljaIlhKNLbbUbWug9Jx9mN30FquCs8r3nXuqGasoibkLhyLeX1QsOPJ2fwvsEatwGIau9VwIO3hSRzlSvq8eR/DMOBcjzKiTVGI/tK03qwgA2yPbELP1tSbMh3HEeXMi6Iv02hgXBh3oY3q+6ePCJxN5jMgmca6oqRllj312WOkepSuKVEQapxc86hR1ilbCmjXTcJFkC+VN7Ruxj6okuLzoU+kVdFH4SyuyOz5yEk1Y/rykK7xrpDAFcOMYFjgZexpFdYLVcT+dVsF5lHQRw/FZRPoPn1JI6ZcqLqFnsMzTb/PFtmgyyQR8W6SZIbwYzaJ5ZlBjLovxXAFDF+7lWR0EwslpLLuPDfS0NZmwqk87JZEyN2TccaKN8wAhUusS8Mb6MjzHtVe9CjSWPp4vLwcLpFMx82HN2wYuvKZiJrPjvqByovF0KaoHdiHKkzEUyFYbKOPTWUKtCkCI2Wc6N8EfVEvVvTVmzghYoItC21OFORdMxGvYErj4/GNjTtBXHk+Bp2G0wRMc1fw90zMpZ6iMmThPvN8iGxCwkRNAbaImLXboiTg8pTQRNdJMl64hfFrSyCacGySP5ipEkwubGY+jUF8HyvsGo3R+zzqleAHOJJi6rqBQDVI16V45RZyQOwz3+GienTvsWTAv/hhchW+CvsWdhx2Z7arCPWFyQMkPNytoBtZlm6fQJJMkS8ym4BzHxKXi7r+7dbRGx3VCoZvfxDvVAEmI55TSWdvDWj0ehJNzd2a2FcOpjirUNZNrq2j78pDkg7FSPtyskG/OYPZUQW8mjAGC5K6wJl+RgbaIzLCDr6B5vvV2QhHJUK9xEG39uFMH5LzqCArZhAZHXRzsbcGBAQwRBowOP037oYY0MUlA6t7fQONWyWBDLkFaxZgRBcXbtDUgN9331CPRBf2Kbehx64r6x4yqjjKS4cOb7c3MVkzWWuBDxv83r/sxwtju1Z1SA==';
// console.log(decryptData(
//     encryptedData,
//     'AES-256-ECB',
//     ''
// ));