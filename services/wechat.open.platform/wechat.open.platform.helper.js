const Q = require('q');
const __CRYPTO__ = require('crypto');
const __CONFIG__ = require('./wechat.open.platform.config');

function PKCS7Decoder(buff) {
    let pad = buff[buff.length - 1];
    if (pad < 1 || pad > 32) {
        pad = 0;
    }
    return buff.slice(0, buff.length - pad);
}

function PKCS7Encoder(buff) {
    let blockSize = 32;
    let strSize = buff.length;
    let amountToPad = blockSize - (strSize % blockSize);
    let pad = new Buffer(amountToPad - 1);
    pad.fill(String.fromCharCode(amountToPad));
    return Buffer.concat([buff, pad]);
}

/**
 * 解密
 * @param encryptedData
 * @returns {String}
 */
function decryptData(encryptedData) {
    // AES密钥：
    // AESKey=Base64_Decode(EncodingAESKey + “=”)，EncodingAESKey尾部填充一个字符的“=”, 用Base64_Decode生成32个字节的AESKey
    let key = new Buffer(__CONFIG__.__SYMMETRIC_KEY__ + '=', 'base64');
    let iv = key.slice(0, 16);
    let aesCipher = __CRYPTO__.createDecipheriv(__CONFIG__.__ALGORITHM__, key, iv);
    aesCipher.setAutoPadding(false);
    //  AES采用CBC模式，秘钥长度为32个字节（256位），数据采用PKCS#7填充
    //  PKCS#7：K为秘钥字节数（采用32），buf为待加密的内容，N为其字节数。Buf 需要被填充为K的整数倍
    //  在buf的尾部填充(K-N%K)个字节，每个字节的内容 是(K- N%K)
    let decipheredBuff = PKCS7Decoder(Buffer.concat([aesCipher.update(encryptedData, 'base64'), aesCipher.final()]));
    let rawMsg = decipheredBuff.slice(16);
    //  前4位为明文长度
    //  设置明文长度时，应通过Buf.writeUInt32BE写入，并转换为binary字符串
    //  读取时，使用Buf.readUInt32BE
    let msgLength = rawMsg.slice(0, 4).readUInt32BE(0);
    //  明文
    let result = rawMsg.slice(4, msgLength + 4).toString();
    //  第三方平台的APPID
    let appId = rawMsg.slice(msgLength + 4).toString();

    if (appId !== __CONFIG__.__APP_ID__) {
        throw 'AppId is invalid';
    }

    return result;
}

/**
 * 消息体签名
 * 为了验证消息体的合法性，开放平台新增消息体签名，开发者可用以验证消息体的真实性，并对验证通过的消息体进行解密。
 * msg_signature=sha1(sort(Token、timestamp、nonce, msg_encrypt))
 *
 * @param timestamp
 * @param nonce
 * @param encrypt
 * @returns {*}
 */
function getSignature(timestamp, nonce, encrypt) {
    let rawSignature = [__CONFIG__.__TOKEN__, timestamp, nonce, encrypt].sort().join('');
    let sha1 = __CRYPTO__.createHash('sha1');
    sha1.update(rawSignature);
    return sha1.digest('hex');
}

/**
 * 消息体解密
 * 开发者先验证消息体签名的正确性，验证通过后，再对消息体进行解密
 * @param msgSignature
 * @param timestamp
 * @param nonce
 * @param encrypt
 * @returns {String}
 */
function decryptMessage(msgSignature, timestamp, nonce, encrypt) {
    const deferred = Q.defer();

    if (getSignature(timestamp, nonce, encrypt) !== msgSignature) {
        deferred.reject('msg_signature is not invalid');
    } else {
        try {
            deferred.resolve(decryptData(encrypt));
        } catch (err) {
            deferred.reject(err);
        }
    }

    return deferred.promise;
}

module.exports = {
    decryptMessage: decryptMessage
};

// console.log(decryptData(
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
// ));

// console.log(getSignature(
//     '1532675835',
//     '1418336492',
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
// ))

// decryptMessage(
//     'f9d4b135c60bc9ac27b4e2742991a20709283078',
//     '1532675835',
//     '1418336492',
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
// );

// { xml:
// { appid: 'wx4328d9d4893f7a2f',
//     encrypt:
//     'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA==' } }
// [2018-07-27T15:17:15.651] [DEBUG] backbone.route.js - {}
//     [2018-07-27T15:17:15.652] [DEBUG] backbone.route.js - { signature: 'cf8da8d147285746176c3573e60bfaa057c622de',
//     timestamp: '1532675835',
//     nonce: '1418336492',
//     encrypt_type: 'aes',
//     msg_signature: 'f9d4b135c60bc9ac27b4e2742991a20709283078' }
