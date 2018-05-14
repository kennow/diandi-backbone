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
/**
 *  商品
 */
const __ADD_NEW_SKU_ATTRIBUTE__ = 'INSERT INTO tb_sku_attribute SET ?';
const __ADD_NEW_SKU_VALUE__ = 'INSERT INTO tb_sku_value SET ?';
const __CHECK_SKU_VALUE__ = 'SELECT COUNT(*) AS number FROM tb_sku_value WHERE value = ? AND aid = ?';
const __ADD_NEW_SKU__ = 'INSERT INTO tb_sku SET ?';
const __ADD_NEW_PRODUCT__ = 'INSERT INTO tb_product SET ?';
const __ADD_REL_PRODUCT_ATTR_VALUE__ = 'INSERT INTO rel_product_attribute_value SET ?';

module.exports = {
    __CHECK_SESSION__: __CHECK_SESSION__,
    __FETCH_USER_INFO__: __FETCH_USER_INFO__,
    __ADD_NEW_CONSIGNEE__: __ADD_NEW_CONSIGNEE__,
    __SET_ALL_CONSIGNEE__: __SET_ALL_CONSIGNEE__,
    __SET_SPECIFIC_CONSIGNEE__: __SET_SPECIFIC_CONSIGNEE__,
    __ADD_NEW_SKU_ATTRIBUTE__: __ADD_NEW_SKU_ATTRIBUTE__,
    __ADD_NEW_SKU_VALUE__: __ADD_NEW_SKU_VALUE__,
    __CHECK_SKU_VALUE__: __CHECK_SKU_VALUE__,
    __ADD_NEW_SKU__: __ADD_NEW_SKU__,
    __ADD_NEW_PRODUCT__: __ADD_NEW_PRODUCT__,
    __ADD_REL_PRODUCT_ATTR_VALUE__: __ADD_REL_PRODUCT_ATTR_VALUE__
};