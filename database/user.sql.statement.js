/**
 *  登录态
 */
const __CHECK_SESSION__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE 3rd_session  = ?';
const __IS_OPENID_REPEAT__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE openid = ?';
const __ADD_MINI_PROGRAM_USER__ = 'INSERT INTO tb_user SET ?';
const __UPDATE_MINI_PROGRAM_USER__ = 'UPDATE tb_user SET ? WHERE openid = ?';
/**
 *  用户
 */
const __FETCH_USER_INFO__ = 'SELECT * FROM tb_user WHERE 3rd_session = ?';
/**
 *  收件人
 */
const __ADD_NEW_CONSIGNEE__ = 'INSERT INTO tb_consignee SET ?';
const __EDIT_CONSIGNEE__ = 'UPDATE tb_consignee SET name = ?, mobile = ?, address = ?, postcode = ? WHERE consignee_no = ?';
const __REMOVE_CONSIGNEE__ = 'DELETE FROM tb_consignee WHERE consignee_no = ?';
const __SET_ALL_CONSIGNEE__ = 'UPDATE tb_consignee SET isDefault = ? WHERE user_id in (SELECT uid FROM tb_user WHERE 3rd_session = ?)';
const __SET_SPECIFIC_CONSIGNEE__ = 'UPDATE tb_consignee SET isDefault = ? WHERE consignee_no = ?';
const __FETCH_DEFAULT_CONSIGNEE__ = 'SELECT b.consignee_no, b.name, b.mobile, b.address, b.postcode FROM tb_user a, tb_consignee b WHERE a.3rd_session = ? and a.uid = b.user_id and  b.isDefault = 1';
const __FETCH_MY_CONSIGNEE__ = 'SELECT b.consignee_no, b.name, b.mobile, b.address, b.postcode, b.isDefault FROM tb_user a, tb_consignee b WHERE a.3rd_session = ? and a.uid = b.user_id';


module.exports = {
    __CHECK_SESSION__: __CHECK_SESSION__,
    __FETCH_USER_INFO__: __FETCH_USER_INFO__,
    __ADD_NEW_CONSIGNEE__: __ADD_NEW_CONSIGNEE__,
    __EDIT_CONSIGNEE__: __EDIT_CONSIGNEE__,
    __REMOVE_CONSIGNEE__: __REMOVE_CONSIGNEE__,
    __SET_ALL_CONSIGNEE__: __SET_ALL_CONSIGNEE__,
    __SET_SPECIFIC_CONSIGNEE__: __SET_SPECIFIC_CONSIGNEE__,
    __FETCH_DEFAULT_CONSIGNEE__: __FETCH_DEFAULT_CONSIGNEE__,
    __FETCH_MY_CONSIGNEE__: __FETCH_MY_CONSIGNEE__,
    __IS_OPENID_REPEAT__: __IS_OPENID_REPEAT__,
    __ADD_MINI_PROGRAM_USER__: __ADD_MINI_PROGRAM_USER__,
    __UPDATE_MINI_PROGRAM_USER__: __UPDATE_MINI_PROGRAM_USER__
};