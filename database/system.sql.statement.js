/**
 *  短信
 */
const __ADD_SMS__ = 'INSERT INTO tb_sms SET ?';
const __CHECK_SMS__ = 'SELECT COUNT(*) AS number FROM tb_sms WHERE requestId = ? and bizId = ? and phone = ? and verificationCode = ?';

module.exports = {
    __ADD_SMS__: __ADD_SMS__,
    __CHECK_SMS__: __CHECK_SMS__
};
