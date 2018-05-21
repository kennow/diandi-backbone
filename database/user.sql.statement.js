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
/**
 *  购物车
 */
const __CHECK_CART__ = 'SELECT COUNT(*) AS number FROM tb_cart WHERE user_id = ? AND stock_no = ?';
const __JOIN_TO_CART__ = 'INSERT INTO tb_cart SET ?';
const __ADD_CART__ = 'UPDATE tb_cart SET amount = amount + ? WHERE user_id = ? AND stock_no = ?';
const __UPDATE_CART__ = 'UPDATE tb_cart SET amount = ? WHERE user_id = ? AND stock_no = ?';
const __REMOVE_MY_CART__ = 'DELETE FROM tb_cart WHERE stock_no  = ? AND user_id in (SELECT uid FROM tb_user WHERE 3rd_session = ?)';
const __FETCH_MY_CART__ = 'SELECT b.stock_no, b.amount, c.unit, c.attributes, d.pid, d.name FROM tb_user a, tb_cart b, tb_sku c, tb_product d WHERE a.3rd_session = ? AND a.uid = b.user_id AND b.stock_no = c.stock_no AND c.product_id = d.pid';
const __FETCH_PRODUCT_SKU__ = 'SELECT a.*, b.name, c.value FROM rel_product_attribute_value a, tb_sku_attribute b, tb_sku_value c WHERE a.aid = b.aid AND a.vid = c.vid AND a.pid in (SELECT DISTINCT c.product_id FROM tb_user a, tb_cart b, tb_sku c WHERE a.3rd_session = ? AND a.uid = b.user_id AND b.stock_no = c.stock_no)';
/**
 *  订单
 */
const __FETCH_MY_ORDER__ = 'SELECT a.out_trade_no, a.totalFee, a.createTime, a.status, b.stock_no, b.amount, c.unit, c.attributes, d.name, d.pid ' +
    'FROM tb_order a, rel_order_sku b, tb_sku c, tb_product d, tb_user e ' +
    'WHERE e.3rd_session = ? AND e.uid = a.user_id AND a.createTime < ? AND a.out_trade_no = b.out_trade_no AND b.stock_no= c.stock_no AND c.product_id = d.pid ' +
    'ORDER BY a.createTime DESC';
const __FETCH_ORDER_SKU__ = 'SELECT a.*, b.name, c.value ' +
    'FROM rel_product_attribute_value a, tb_sku_attribute b, tb_sku_value c ' +
    'WHERE a.aid = b.aid AND a.vid = c.vid AND ' +
    'a.pid in (SELECT DISTINCT c.product_id ' +
    'FROM tb_order a, rel_order_sku b, tb_sku c, tb_product d, tb_user e ' +
    'WHERE e.3rd_session = ? AND e.uid = a.user_id AND a.createTime < ? AND a.out_trade_no = b.out_trade_no AND b.stock_no= c.stock_no AND c.product_id = d.pid)';

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
    __UPDATE_MINI_PROGRAM_USER__: __UPDATE_MINI_PROGRAM_USER__,
    __CHECK_CART__: __CHECK_CART__,
    __JOIN_TO_CART__: __JOIN_TO_CART__,
    __ADD_CART__: __ADD_CART__,
    __UPDATE_CART__: __UPDATE_CART__,
    __REMOVE_MY_CART__: __REMOVE_MY_CART__,
    __FETCH_MY_CART__: __FETCH_MY_CART__,
    __FETCH_PRODUCT_SKU__: __FETCH_PRODUCT_SKU__,
    __FETCH_MY_ORDER__: __FETCH_MY_ORDER__,
    __FETCH_ORDER_SKU__: __FETCH_ORDER_SKU__
};