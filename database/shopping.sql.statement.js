/**
 *  登录态
 */
const __CHECK_SESSION__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE 3rd_session  = ?';
/**
 *  用户
 */
const __FETCH_USER_INFO__ = 'SELECT * FROM tb_user WHERE 3rd_session = ?';
/**
 *  收件人
 */
const __ADD_NEW_CONSIGNEE__ = 'INSERT INTO tb_consignee SET ?';
const __SET_ALL_CONSIGNEE__ = 'UPDATE tb_consignee SET isDefault = ? WHERE user_id in (SELECT uid FROM tb_user WHERE 3rd_session = ?)';
const __SET_SPECIFIC_CONSIGNEE__ = 'UPDATE tb_consignee SET isDefault = ? WHERE consignee_no = ?';

module.exports = {
    __CHECK_SESSION__: __CHECK_SESSION__,
    __FETCH_USER_INFO__: __FETCH_USER_INFO__,
    __ADD_NEW_CONSIGNEE__: __ADD_NEW_CONSIGNEE__,
    __SET_ALL_CONSIGNEE__: __SET_ALL_CONSIGNEE__,
    __SET_SPECIFIC_CONSIGNEE__: __SET_SPECIFIC_CONSIGNEE__
};