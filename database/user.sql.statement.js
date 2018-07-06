/**
 *  登录态
 */
const __CHECK_SESSION__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE 3rd_session  = ?';
const __CHECK_MOBILE__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE phone  = ?';
const __IS_OPENID_REPEAT__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE openid = ?';
const __ADD_MINI_PROGRAM_USER__ = 'INSERT INTO tb_user SET ?';
const __UPDATE_MINI_PROGRAM_USER__ = 'UPDATE tb_user SET ? WHERE openid = ?';
/**
 *  用户
 */
const __FETCH_USER_SESSION__ = 'SELECT 3rd_session FROM tb_user WHERE phone = ?';
const __FETCH_USER_INFO__ = 'SELECT * FROM tb_user WHERE 3rd_session = ?';
const __CHECK_PERMISSION__ = 'SELECT COUNT(*) AS number FROM tb_user a, tb_role b, rel_role_action c WHERE c.module = ? AND c.action = ? AND a.3rd_session = ? AND a.role = b.rid AND b.rid = c.role_id';
const __FETCH_SPECIFIC_WECHAT__ = 'SELECT nickname, sex, headimgurl FROM tb_wechat a, tb_user b WHERE a.openid = b.openid AND b.uid = ?';
/**
 *  管理员
 */
const __FETCH_ALL_USER__ = 'SELECT phone, 3rd_session, description FROM tb_user a, tb_role b WHERE a.role = b.rid;';
const __FETCH_MANAGER__ = 'SELECT phone, 3rd_session, description FROM tb_user a, tb_role b WHERE role <> 1 AND a.role = b.rid;';
const __ADD_ROLE_ACTION__ = 'INSERT INTO rel_role_action SET ?';
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
const __FETCH_SPECIFIC_CONSIGNEE__ = 'SELECT name, mobile, address, postcode FROM tb_consignee WHERE consignee_no = ?';
/**
 *  购物车
 */
const __CHECK_CART__ = 'SELECT COUNT(*) AS number FROM tb_cart WHERE user_id = ? AND stock_no = ?';
const __JOIN_TO_CART__ = 'INSERT INTO tb_cart SET ?';
const __ADD_CART__ = 'UPDATE tb_cart SET amount = amount + ? WHERE user_id = ? AND stock_no = ?';
const __UPDATE_CART__ = 'UPDATE tb_cart SET amount = ? WHERE user_id = ? AND stock_no = ?';
const __REMOVE_MY_CART__ = 'DELETE FROM tb_cart WHERE stock_no  = ? AND user_id in (SELECT uid FROM tb_user WHERE 3rd_session = ?)';
const __REMOVE_CART_ITEM__ = 'DELETE FROM tb_cart WHERE stock_no = ? and user_id in (SELECT uid FROM tb_user WHERE 3rd_session = ?)';
const __FETCH_MY_CART__ = 'SELECT b.stock_no, b.amount, c.unit, c.attributes, d.pid, d.name FROM tb_user a, tb_cart b, tb_sku c, tb_product d WHERE a.3rd_session = ? AND a.uid = b.user_id AND b.stock_no = c.stock_no AND c.product_id = d.pid';
const __FETCH_MY_CART_THUMBNAILS__ = 'SELECT a.name, b.productid FROM tb_gallery a, rel_product_gallery b ' +
    ' WHERE b.type = 0 AND a.imageid = b.imageid AND b.productid IN ' +
    '(SELECT DISTINCT d.pid FROM tb_user a, tb_cart b, tb_sku c, tb_product d WHERE a.3rd_session = ? AND a.uid = b.user_id AND b.stock_no = c.stock_no AND c.product_id = d.pid)';
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
const __FETCH_ORDER_THUMBNAILS__ = 'SELECT a.name, b.productid FROM tb_gallery a, rel_product_gallery b ' +
    ' WHERE b.type = 0 AND a.imageid = b.imageid AND b.productid IN ' +
    '(SELECT DISTINCT c.product_id ' +
    'FROM tb_order a, rel_order_sku b, tb_sku c, tb_product d, tb_user e ' +
    'WHERE e.3rd_session = ? AND e.uid = a.user_id AND a.createTime < ? AND a.out_trade_no = b.out_trade_no AND b.stock_no= c.stock_no AND c.product_id = d.pid)';
/**
 *  退款
 */
const __CHECK_REFUND__ = 'SELECT COUNT(*) AS number FROM tb_refund WHERE out_trade_no = ? ';
const __SUBMIT_REFUND__ = 'INSERT INTO tb_refund SET ?';
const __ADD_REL_REFUND_SKU__ = 'INSERT INTO rel_refund_sku SET ?';

module.exports = {
    __CHECK_SESSION__: __CHECK_SESSION__,
    __CHECK_MOBILE__: __CHECK_MOBILE__,
    __FETCH_USER_INFO__: __FETCH_USER_INFO__,
    __FETCH_USER_SESSION__: __FETCH_USER_SESSION__,
    __FETCH_SPECIFIC_WECHAT__: __FETCH_SPECIFIC_WECHAT__,
    __FETCH_ALL_USER__: __FETCH_ALL_USER__,
    __FETCH_MANAGER__: __FETCH_MANAGER__,
    __ADD_ROLE_ACTION__: __ADD_ROLE_ACTION__,
    __CHECK_PERMISSION__: __CHECK_PERMISSION__,
    __ADD_NEW_CONSIGNEE__: __ADD_NEW_CONSIGNEE__,
    __EDIT_CONSIGNEE__: __EDIT_CONSIGNEE__,
    __REMOVE_CONSIGNEE__: __REMOVE_CONSIGNEE__,
    __SET_ALL_CONSIGNEE__: __SET_ALL_CONSIGNEE__,
    __SET_SPECIFIC_CONSIGNEE__: __SET_SPECIFIC_CONSIGNEE__,
    __FETCH_DEFAULT_CONSIGNEE__: __FETCH_DEFAULT_CONSIGNEE__,
    __FETCH_MY_CONSIGNEE__: __FETCH_MY_CONSIGNEE__,
    __FETCH_SPECIFIC_CONSIGNEE__: __FETCH_SPECIFIC_CONSIGNEE__,
    __IS_OPENID_REPEAT__: __IS_OPENID_REPEAT__,
    __ADD_MINI_PROGRAM_USER__: __ADD_MINI_PROGRAM_USER__,
    __UPDATE_MINI_PROGRAM_USER__: __UPDATE_MINI_PROGRAM_USER__,
    __CHECK_CART__: __CHECK_CART__,
    __JOIN_TO_CART__: __JOIN_TO_CART__,
    __ADD_CART__: __ADD_CART__,
    __UPDATE_CART__: __UPDATE_CART__,
    __REMOVE_MY_CART__: __REMOVE_MY_CART__,
    __REMOVE_CART_ITEM__: __REMOVE_CART_ITEM__,
    __FETCH_MY_CART__: __FETCH_MY_CART__,
    __FETCH_MY_CART_THUMBNAILS__: __FETCH_MY_CART_THUMBNAILS__,
    __FETCH_PRODUCT_SKU__: __FETCH_PRODUCT_SKU__,
    __FETCH_MY_ORDER__: __FETCH_MY_ORDER__,
    __FETCH_ORDER_SKU__: __FETCH_ORDER_SKU__,
    __FETCH_ORDER_THUMBNAILS__: __FETCH_ORDER_THUMBNAILS__,
    __CHECK_REFUND__: __CHECK_REFUND__,
    __SUBMIT_REFUND__: __SUBMIT_REFUND__,
    __ADD_REL_REFUND_SKU__: __ADD_REL_REFUND_SKU__
};