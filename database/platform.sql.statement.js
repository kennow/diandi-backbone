/**
 *  授权方
 */
const __ADD_AUTHORIZER__ = 'INSERT INTO tb_authorizer SET ?';
const __REFRESH_AUTHORIZER__ = 'UPDATE tb_authorizer SET accessToken = ?, expiresIn = ?, refreshToken = ? WHERE appid = ?';
const __CHECK_AUTHORIZER__ = 'SELECT COUNT(*) AS number FROM tb_authorizer WHERE appid = ?';
const __FETCH_AUTHORIZER__ = 'SELECT * FROM tb_authorizer WHERE appid = ?';

module.exports = {
    __ADD_AUTHORIZER__: __ADD_AUTHORIZER__,
    __REFRESH_AUTHORIZER__: __REFRESH_AUTHORIZER__,
    __CHECK_AUTHORIZER__: __CHECK_AUTHORIZER__,
    __FETCH_AUTHORIZER__: __FETCH_AUTHORIZER__
};
