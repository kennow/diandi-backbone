const __IS_OPENID_REPEAT__ =  'SELECT COUNT(*) AS number FROM tb_user WHERE openid = ?';
const __ADD_MINI_PROGRAM_USER__ = 'INSERT INTO tb_user SET ?';
const __UPDATE_MINI_PROGRAM_USER__ = 'UPDATE tb_user SET ? WHERE openid = ?';

module.exports = {
    __IS_OPENID_REPEAT__: __IS_OPENID_REPEAT__,
    __ADD_MINI_PROGRAM_USER__: __ADD_MINI_PROGRAM_USER__,
    __UPDATE_MINI_PROGRAM_USER__: __UPDATE_MINI_PROGRAM_USER__
};