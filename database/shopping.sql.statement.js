/**
 *  登录态
 */
const __CHECK_SESSION__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE 3rd_session  = ?';
/**
 *  用户
 */
const __FETCH_USER_INFO__ = 'SELECT * FROM tb_user WHERE 3rd_session = ?';
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
 *  订单
 */
const __ADD_NEW_ORDER__ = 'INSERT INTO tb_order SET ?';
const __CHECK_STOCK__ = 'SELECT stock FROM tb_sku WHERE stock_no = ?';
const __UPDATE_STOCK__ = 'UPDATE tb_sku SET stock = stock - ? WHERE stock_no = ? ';
const __UPDATE_PRODUCT_SALES__ = '';
const __CHECK_CONSISTENCY__ = 'SELECT COUNT(*) AS number FROM tb_order WHERE out_trade_no = ? and totalFee = ?';
const __UPDATE_ORDER_AFTER_PAY__ = 'UPDATE tb_order SET bankType = ?, mchID = ?, tradeType = ?, transactionID = ?, payTime = ?, status = ?, remark = ? WHERE out_trade_no = ?';
const __CHANGE_ORDER_STATUS__ = 'UPDATE tb_order SET status = ? WHERE out_trade_no = ? ';
const __FETCH_PRODUCT_LIST__ = 'SELECT * FROM tb_product';
const __FETCH_PRODUCT_STANDARDS__ = 'SELECT b.*, c.vid, c.value FROM rel_product_attribute_value a, tb_sku_attribute b, tb_sku_value c WHERE a.pid = ? AND a.aid = b.aid AND a.vid = c.vid';
const __FETCH_SKU_LIST__ = 'SELECT stock_no, unit, stock, attributes FROM tb_sku WHERE product_id = ?';
const __ADD_NEW_REFUND__ = 'INSERT INTO tb_refund SET ?';
const __CHANGE_REFUND_STATUS__ = 'UPDATE tb_refund SET completeTime = ?, status = ?, remark = ? WHERE out_refund_no = ?';
const __ADD_REL_ORDER_SKU__ = 'INSERT INTO rel_order_sku SET ?';

module.exports = {
    __CHECK_SESSION__: __CHECK_SESSION__,
    __FETCH_USER_INFO__: __FETCH_USER_INFO__,
    __ADD_NEW_SKU_ATTRIBUTE__: __ADD_NEW_SKU_ATTRIBUTE__,
    __ADD_NEW_SKU_VALUE__: __ADD_NEW_SKU_VALUE__,
    __CHECK_SKU_VALUE__: __CHECK_SKU_VALUE__,
    __ADD_NEW_SKU__: __ADD_NEW_SKU__,
    __ADD_NEW_PRODUCT__: __ADD_NEW_PRODUCT__,
    __ADD_REL_PRODUCT_ATTR_VALUE__: __ADD_REL_PRODUCT_ATTR_VALUE__,
    __FETCH_PRODUCT_LIST__: __FETCH_PRODUCT_LIST__,
    __FETCH_PRODUCT_STANDARDS__: __FETCH_PRODUCT_STANDARDS__,
    __FETCH_SKU_LIST__: __FETCH_SKU_LIST__,
    __ADD_NEW_ORDER__: __ADD_NEW_ORDER__,
    __CHECK_STOCK__: __CHECK_STOCK__,
    __UPDATE_STOCK__: __UPDATE_STOCK__,
    __CHECK_CONSISTENCY__: __CHECK_CONSISTENCY__,
    __UPDATE_ORDER_AFTER_PAY__: __UPDATE_ORDER_AFTER_PAY__,
    __ADD_REL_ORDER_SKU__: __ADD_REL_ORDER_SKU__,
    __CHANGE_ORDER_STATUS__: __CHANGE_ORDER_STATUS__,
    __UPDATE_PRODUCT_SALES__: __UPDATE_PRODUCT_SALES__,
    __ADD_NEW_REFUND__: __ADD_NEW_REFUND__,
    __CHANGE_REFUND_STATUS__: __CHANGE_REFUND_STATUS__
};