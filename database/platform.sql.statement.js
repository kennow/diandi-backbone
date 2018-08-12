/**
 *  授权方
 */
const __ADD_AUTHORIZER__ = 'INSERT INTO tb_authorizer SET ?';
const __REFRESH_AUTHORIZER__ = 'UPDATE tb_authorizer SET accessToken = ?, expiresIn = ?, refreshToken = ?, funcInfo = ? WHERE appid = ?';
const __CHECK_AUTHORIZER__ = 'SELECT COUNT(*) AS number FROM tb_authorizer WHERE appid = ?';
const __FETCH_AUTHORIZER_ACCESS_TOKEN__ = 'SELECT * FROM tb_authorizer WHERE appid = ?';
const __FETCH_AUTHORIZER_INFO__ = 'SELECT a.* FROM tb_authorizer a, tb_user b, rel_authorizer_user c WHERE b.3rd_session = ? AND b.openid = c.openid AND c.appid = a.appid';
const __CHECK_REL_AUTHORIZER_USER__ = 'SELECT COUNT(*) AS number FROM rel_authorizer_user WHERE appid = ? and openid in (SELECT openid from tb_user where 3rd_session = ?)';
const __ADD_REL_AUTHORIZER_USER__ = 'INSERT INTO rel_authorizer_user SELECT ? AS appid, openid FROM tb_user WHERE 3rd_session = ?';

module.exports = {
    __ADD_AUTHORIZER__: __ADD_AUTHORIZER__,
    __REFRESH_AUTHORIZER__: __REFRESH_AUTHORIZER__,
    __CHECK_AUTHORIZER__: __CHECK_AUTHORIZER__,
    __FETCH_AUTHORIZER_ACCESS_TOKEN__: __FETCH_AUTHORIZER_ACCESS_TOKEN__,
    __FETCH_AUTHORIZER_INFO__: __FETCH_AUTHORIZER_INFO__,
    __CHECK_REL_AUTHORIZER_USER__: __CHECK_REL_AUTHORIZER_USER__,
    __ADD_REL_AUTHORIZER_USER__: __ADD_REL_AUTHORIZER_USER__
};
