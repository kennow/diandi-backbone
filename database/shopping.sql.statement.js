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
/**
 *  购物车
 */
const __CHECK_CART__ = 'SELECT COUNT(*) AS number FROM tb_cart WHERE user_id = ? AND stock_no = ?';
const __JOIN_TO_CART__ = 'INSERT INTO tb_cart SET ?';
const __UPDATE_CART__ = 'UPDATE tb_cart SET amount = ? WHERE user_id = ? AND stock_no = ?';
/**
 *  订单
 */
const __ADD_NEW_ORDER__ = 'INSERT INTO tb_order SET ?';
const __CHECK_STOCK__ = 'SELECT stock FROM tb_sku WHERE stock_no = ?';
const __UPDATE_STOCK__ = 'UPDATE tb_sku SET stock = stock - ? WHERE stock_no = ? ';
const __UPDATE_PRODUCT_SALES__ = '';
const __UPDATE_ORDER_AFTER_PAY__ = 'UPDATE tb_order SET bankType = ?, mchID = ?, tradeType = ?, transactionID = ?, payTime = ?, status = ? WHERE out_trade_no = ?';
const __CHANGE_ORDER_STATUS__ = 'UPDATE tb_order SET status = ? WHERE out_trade_no = ? ';
const __FETCH_PRODUCT_LIST__ = 'SELECT * FROM tb_product';
const __ADD_NEW_REFUND__ = 'INSERT INTO tb_refund SET ?';
const __CHANGE_REFUND_STATUS__ = 'UPDATE tb_refund SET completeTime = ?, status = ?, remark = ? WHERE out_refund_no = ?';
const __ADD_REL_ORDER_SKU__ = 'INSERT INTO rel_order_sku SET ?';

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
    __ADD_REL_PRODUCT_ATTR_VALUE__: __ADD_REL_PRODUCT_ATTR_VALUE__,
    __FETCH_PRODUCT_LIST__: __FETCH_PRODUCT_LIST__,
    __CHECK_CART__: __CHECK_CART__,
    __JOIN_TO_CART__: __JOIN_TO_CART__,
    __UPDATE_CART__: __UPDATE_CART__,
    __ADD_NEW_ORDER__: __ADD_NEW_ORDER__,
    __CHECK_STOCK__: __CHECK_STOCK__,
    __UPDATE_STOCK__: __UPDATE_STOCK__,
    __UPDATE_ORDER_AFTER_PAY__: __UPDATE_ORDER_AFTER_PAY__,
    __ADD_REL_ORDER_SKU__: __ADD_REL_ORDER_SKU__,
    __CHANGE_ORDER_STATUS__: __CHANGE_ORDER_STATUS__,
    __UPDATE_PRODUCT_SALES__: __UPDATE_PRODUCT_SALES__,
    __ADD_NEW_REFUND__: __ADD_NEW_REFUND__,
    __CHANGE_REFUND_STATUS__: __CHANGE_REFUND_STATUS__
};