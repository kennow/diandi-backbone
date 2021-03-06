/**
 *  商品
 */
const __ADD_NEW_SKU_ATTRIBUTE__ = 'INSERT INTO tb_sku_attribute SET ?';
const __ADD_NEW_SKU_VALUE__ = 'INSERT INTO tb_sku_value SET ?';
const __ADD_NEW_IMAGE__ = 'INSERT INTO tb_gallery SET ?';
const __CHECK_SKU_ATTRIBUTE__ = 'SELECT COUNT(*) AS number FROM tb_sku_attribute WHERE name = ?';
const __CHECK_SKU_VALUE__ = 'SELECT COUNT(*) AS number FROM tb_sku_value WHERE value = ? AND aid = ?';
const __ADD_NEW_SKU__ = 'INSERT INTO tb_sku SET ?';
const __ADD_NEW_PRODUCT__ = 'INSERT INTO tb_product SET ?';
const __ADD_REL_PRODUCT_ATTR_VALUE__ = 'INSERT INTO rel_product_attribute_value SET ?';
const __ADD_REL_PRODUCT_GALLERY__ = 'INSERT INTO rel_product_gallery SET ?';
const __FETCH_PRODUCT_FULL__ = 'SELECT * FROM tb_product WHERE createTime < ? ORDER BY createTime DESC LIMIT ?';
const __FETCH_PRODUCT_PART__ = 'SELECT * FROM tb_product WHERE status = 0 AND createTime < ? ORDER BY createTime DESC LIMIT ?';
const __FETCH_PARTIAL_PRODUCT__ = 'SELECT pid, name, type FROM tb_product ORDER BY createTime DESC LIMIT ?,?';
const __FETCH_PRODUCT_DETAILS__ = 'SELECT name, description, sales, type FROM tb_product WHERE pid = ?';
const __FETCH_PRODUCT_THUMBNAILS__ = 'SELECT a.productid, b.name FROM rel_product_gallery a, tb_gallery b WHERE a.productid in (SELECT foo.pid FROM (SELECT pid FROM tb_product WHERE createTime < ? ORDER BY createTime DESC LIMIT ?) as foo) AND a.type = 0 AND a.imageid = b.imageid';
const __FETCH_PRODUCT_STANDARDS__ = 'SELECT b.*, c.vid, c.value FROM rel_product_attribute_value a, tb_sku_attribute b, tb_sku_value c WHERE a.pid = ? AND a.aid = b.aid AND a.vid = c.vid';
const __FETCH_PRODUCT_GALLERY__ = 'SELECT a.productid, a.type, b.name FROM rel_product_gallery a, tb_gallery b WHERE a.productid = ? AND a.imageid = b.imageid';
const __FETCH_SKU_LIST__ = 'SELECT stock_no, unit, stock, attributes FROM tb_sku WHERE product_id = ?';
const __FETCH_SKU_ATTRIBUTE__ = 'SELECT * FROM tb_sku_attribute WHERE name = ? LIMIT 1';
const __FETCH_SKU_VALUE__ = 'SELECT * FROM tb_sku_value WHERE value = ? AND aid = ? LIMIT 1';
const __UPDATE_PRODUCT_STATUS__ = 'UPDATE tb_product SET status = ? WHERE pid = ?';
const __REMOVE_PRODUCT__ = 'DELETE FROM tb_product WHERE pid = ?';
const __REMOVE_PRODUCT_SKU__ = 'DELETE FROM tb_sku WHERE product_id = ?';
const __REMOVE_PRODUCT_ATTRIBUTE__ = 'DELETE FROM rel_product_attribute_value WHERE pid = ?';
const __REMOVE_PRODUCT_GALLERY__ = 'DELETE FROM rel_product_gallery WHERE productid = ?';

/**
 *  订单
 */
const __ADD_NEW_ORDER__ = 'INSERT INTO tb_order SET ?';
const __CHECK_STOCK__ = 'SELECT stock FROM tb_sku WHERE stock_no = ?';
const __UPDATE_STOCK__ = 'UPDATE tb_sku SET stock = stock - ? WHERE stock_no = ? ';
const __UPDATE_PRODUCT_SALES__ = '';
const __CHECK_CONSISTENCY__ = 'SELECT COUNT(*) AS number FROM tb_order WHERE out_trade_no = ? and totalFee = ?';
const __UPDATE_ORDER_AFTER_PAY__ = 'UPDATE tb_order SET bankType = ?, mchID = ?, tradeType = ?, transactionID = ?, payTime = ?, status = ?, remark = ? WHERE out_trade_no = ?';
const __CHANGE_ORDER_STATUS__ = 'UPDATE tb_order SET status = ?, remark = ? WHERE out_trade_no = ? ';
const __ADD_REL_ORDER_SKU__ = 'INSERT INTO rel_order_sku SET ?';
const __FETCH_ORDER_DETAIL__ = 'SELECT a.totalFee, a.freight, a.attach, a.createTime, a.payTime, a.status, b.name, b.mobile, b.address, b.postcode FROM tb_order a LEFT JOIN tb_consignee b ON a.consignee_no = b.consignee_no WHERE a.out_trade_no = ?';
const __FETCH_ORDER_PRODUCT__ = 'SELECT a.stock_no, c.pid, c.type FROM tb_sku a, rel_order_sku b, tb_product c WHERE a.stock_no = b.stock_no AND a.product_id = c.pid AND b.out_trade_no = ? ';
const __FETCH_ORDER_LIST__ = 'SELECT out_trade_no, user_id, consignee_no, createTime, payTime, totalFee, a.status, attach, remark ' +
    'FROM tb_order a, tb_user b WHERE b.3rd_session = ? AND a.user_id = b.uid AND a.createTime < ? ORDER BY a.createTime DESC limit ?';
const __FETCH_A_ORDER__ = 'SELECT a.stock_no, a.amount, b.unit, b.attributes, c.name, c.pid ' +
    'FROM rel_order_sku a, tb_sku b, tb_product c ' +
    'WHERE a.out_trade_no = ? AND a.stock_no = b.stock_no AND b.product_id = c.pid';
const __FETCH_A_ORDER_SKU__ = 'SELECT a.*, b.name, c.value FROM rel_product_attribute_value a, tb_sku_attribute b, tb_sku_value c ' +
    'WHERE a.aid = b.aid AND a.vid = c.vid AND a.pid in ' +
    '(SELECT DISTINCT b.product_id FROM rel_order_sku a, tb_sku b, tb_product c ' +
    'WHERE a.out_trade_no = ? AND a.stock_no = b.stock_no AND b.product_id = c.pid)';
const __FETCH_PREPAY_ID__ = 'SELECT prepayID FROM tb_order WHERE out_trade_no = ?';
const __FETCH_ORDER_NOT_PAY_TIMEOUT__ = 'SELECT * FROM tb_order WHERE status = 0 AND TIMESTAMPDIFF(second, createTime, now()) > 1800';
const __EVER_BOUGHT__ = 'SELECT  c.* FROM tb_order a, tb_user b, rel_order_sku c WHERE a.status = 1 AND b.3rd_session = ? AND c.stock_no = ? AND a.user_id = b.uid AND a.out_trade_no = c.out_trade_no';
/**
 *   退款
 */
const __SUBMIT_NEW_REFUND__ = 'UPDATE tb_refund SET refund_id = ?, status = ?, startTime = ?, remark = ? WHERE out_refund_no = ?';
const __CHANGE_REFUND_STATUS__ = 'UPDATE tb_refund SET complete = ?, status = ?, remark = ? WHERE out_refund_no = ?';
const __FETCH_REFUND_INFO__ = 'SELECT * FROM tb_refund WHERE out_trade_no = ? ';
const __CHECK_REFUND_STATUS__ = 'SELECT COUNT(*) AS number FROM tb_refund WHERE out_refund_no = ? AND status = 0';
/**
 *   卡券
 */
const __QUERY_PRODUCT_CARD__ = 'SELECT * FROM rel_product_card WHERE productId = ?';
const __CHECK_ASSOCIATE__ = 'SELECT COUNT(*) AS number FROM rel_product_card WHERE productId = ?';
const __ADD_PRODUCT_CARD__ = 'INSERT INTO rel_product_card SET ?';
const __UPDATE_PRODUCT_CARD__ = 'UPDATE rel_product_card SET cardId = ? WHERE productId = ? ';
const __CHECK_OPENID_CONSISTENCY__ = 'SELECT COUNT(*) AS number FROM tb_user WHERE openid = ? AND 3rd_session = ?';
const __CHECK_USER_CARD_RECORD__ = 'SELECT * FROM tb_card WHERE cardid = ? AND code = ?';
const __ADD_USER_CARD_RECORD__ = 'INSERT INTO tb_card SET ?';
const __UPDATE_USER_CARD_RECORD__ = 'UPDATE tb_card SET out_trade_no = ?, openid = ? WHERE cardid = ? AND code = ?';
const __UPDATE_USER_CARD_RECORD_FROM_BACKBONE__ = 'UPDATE tb_card SET createTime = ?, toUserName = ?, fromUserName = ?, unionid = ?, isGiveByFriend = ?, friendUserName = ?, oldUserCardCode = ?, outerid = ?  WHERE cardid = ? AND code = ?';
const __QUERY_USER_CARDS__ = 'SELECT cardid, code FROM tb_card WHERE out_trade_no in (%s)';
const __USER_PAY_FROM_PAY_CELL__ = 'UPDATE tb_card SET payCellTime = ?, transid = ?, locationid = ?, fee = ?, originalFee = ? WHERE cardid = ? AND code = ?';
const __USER_CONSUME_CARD__ = 'UPDATE tb_card SET consumeTime = ?, consumeSource = ?, staffOpenid = ?, transid = ? WHERE cardid = ? AND code = ?';
const __EVER_GET_CARD__ = 'SELECT d.cardid, c.* FROM tb_order a, tb_user b, rel_order_sku c, tb_card d WHERE a.status = 1 AND b.3rd_session = ? AND c.stock_no = ? AND a.user_id = b.uid AND a.out_trade_no = c.out_trade_no AND c.out_trade_no = d.out_trade_no';
/**
 *   商户
 */
const __FETCH_BUSINESS_LIST__ = 'SELECT * FROM tb_business';
const __FETCH_ONLINE_BUSINESS_LIST__ = 'SELECT c.*, d.mediaId FROM (SELECT a.*, b.productId FROM tb_business a LEFT JOIN rel_business_product b ON a.bid = b.businessId WHERE a.status = 1) AS c LEFT JOIN rel_business_material d ON c.bid = d.businessId';
const __FETCH_BUSINESS__ = 'SELECT * FROM tb_business WHERE bid = ?';
const __FETCH_REL_BUSINESS_PRODUCT__ = 'SELECT * FROM rel_business_product WHERE businessId = ?';
const __FETCH_REL_BUSINESS_MATERIAL__ = 'SELECT * FROM rel_business_material WHERE businessId = ?';
const __ADD_BUSINESS__ = 'INSERT INTO tb_business SET ?';
const __UPDATE_BUSINESS__ = 'UPDATE tb_business SET ? WHERE bid = ?';
const __ADD_REL_BUSINESS_PRODUCT__ = 'INSERT INTO rel_business_product SET ?';
const __ADD_REL_BUSINESS_MATERIAL__ = 'INSERT INTO rel_business_material SET ?';
const __REMOVE_BUSINESS__ = 'DELETE FROM tb_business WHERE bid = ?';
const __REMOVE_REL_BUSINESS_PRODUCT__ = 'DELETE FROM rel_business_product WHERE businessId = ?';
const __REMOVE_REL_BUSINESS_MATERIAL__ = 'DELETE FROM rel_business_material WHERE businessId = ?';
const __UPDATE_BUSINESS_STATUS__ = 'UPDATE tb_business SET status = ? WHERE bid = ?';

module.exports = {
    __ADD_NEW_SKU_ATTRIBUTE__: __ADD_NEW_SKU_ATTRIBUTE__,
    __ADD_NEW_SKU_VALUE__: __ADD_NEW_SKU_VALUE__,
    __ADD_NEW_IMAGE__: __ADD_NEW_IMAGE__,
    __CHECK_SKU_ATTRIBUTE__: __CHECK_SKU_ATTRIBUTE__,
    __CHECK_SKU_VALUE__: __CHECK_SKU_VALUE__,
    __ADD_NEW_SKU__: __ADD_NEW_SKU__,
    __ADD_NEW_PRODUCT__: __ADD_NEW_PRODUCT__,
    __ADD_REL_PRODUCT_ATTR_VALUE__: __ADD_REL_PRODUCT_ATTR_VALUE__,
    __ADD_REL_PRODUCT_GALLERY__: __ADD_REL_PRODUCT_GALLERY__,
    __FETCH_PRODUCT_FULL__: __FETCH_PRODUCT_FULL__,
    __FETCH_PRODUCT_PART__: __FETCH_PRODUCT_PART__,
    __FETCH_PARTIAL_PRODUCT__: __FETCH_PARTIAL_PRODUCT__,
    __FETCH_PRODUCT_DETAILS__: __FETCH_PRODUCT_DETAILS__,
    __FETCH_PRODUCT_THUMBNAILS__: __FETCH_PRODUCT_THUMBNAILS__,
    __FETCH_PRODUCT_STANDARDS__: __FETCH_PRODUCT_STANDARDS__,
    __FETCH_PRODUCT_GALLERY__: __FETCH_PRODUCT_GALLERY__,
    __FETCH_SKU_LIST__: __FETCH_SKU_LIST__,
    __FETCH_SKU_ATTRIBUTE__: __FETCH_SKU_ATTRIBUTE__,
    __FETCH_SKU_VALUE__: __FETCH_SKU_VALUE__,
    __UPDATE_PRODUCT_STATUS__: __UPDATE_PRODUCT_STATUS__,
    __REMOVE_PRODUCT__: __REMOVE_PRODUCT__,
    __REMOVE_PRODUCT_SKU__: __REMOVE_PRODUCT_SKU__,
    __REMOVE_PRODUCT_ATTRIBUTE__: __REMOVE_PRODUCT_ATTRIBUTE__,
    __REMOVE_PRODUCT_GALLERY__: __REMOVE_PRODUCT_GALLERY__,
    __ADD_NEW_ORDER__: __ADD_NEW_ORDER__,
    __CHECK_STOCK__: __CHECK_STOCK__,
    __UPDATE_STOCK__: __UPDATE_STOCK__,
    __CHECK_CONSISTENCY__: __CHECK_CONSISTENCY__,
    __UPDATE_ORDER_AFTER_PAY__: __UPDATE_ORDER_AFTER_PAY__,
    __ADD_REL_ORDER_SKU__: __ADD_REL_ORDER_SKU__,
    __CHANGE_ORDER_STATUS__: __CHANGE_ORDER_STATUS__,
    __UPDATE_PRODUCT_SALES__: __UPDATE_PRODUCT_SALES__,
    __EVER_BOUGHT__: __EVER_BOUGHT__,
    __SUBMIT_NEW_REFUND__: __SUBMIT_NEW_REFUND__,
    __CHANGE_REFUND_STATUS__: __CHANGE_REFUND_STATUS__,
    __FETCH_ORDER_DETAIL__: __FETCH_ORDER_DETAIL__,
    __FETCH_ORDER_PRODUCT__: __FETCH_ORDER_PRODUCT__,
    __FETCH_ORDER_LIST__: __FETCH_ORDER_LIST__,
    __FETCH_A_ORDER__: __FETCH_A_ORDER__,
    __FETCH_A_ORDER_SKU__: __FETCH_A_ORDER_SKU__,
    __FETCH_PREPAY_ID__: __FETCH_PREPAY_ID__,
    __FETCH_ORDER_NOT_PAY_TIMEOUT__: __FETCH_ORDER_NOT_PAY_TIMEOUT__,
    __FETCH_REFUND_INFO__: __FETCH_REFUND_INFO__,
    __CHECK_REFUND_STATUS__: __CHECK_REFUND_STATUS__,
    __QUERY_PRODUCT_CARD__: __QUERY_PRODUCT_CARD__,
    __CHECK_ASSOCIATE__: __CHECK_ASSOCIATE__,
    __ADD_PRODUCT_CARD__: __ADD_PRODUCT_CARD__,
    __UPDATE_BUSINESS__: __UPDATE_BUSINESS__,
    __UPDATE_PRODUCT_CARD__: __UPDATE_PRODUCT_CARD__,
    __CHECK_OPENID_CONSISTENCY__: __CHECK_OPENID_CONSISTENCY__,
    __CHECK_USER_CARD_RECORD__: __CHECK_USER_CARD_RECORD__,
    __ADD_USER_CARD_RECORD__: __ADD_USER_CARD_RECORD__,
    __UPDATE_USER_CARD_RECORD__: __UPDATE_USER_CARD_RECORD__,
    __UPDATE_USER_CARD_RECORD_FROM_BACKBONE__: __UPDATE_USER_CARD_RECORD_FROM_BACKBONE__,
    __QUERY_USER_CARDS__: __QUERY_USER_CARDS__,
    __USER_PAY_FROM_PAY_CELL__: __USER_PAY_FROM_PAY_CELL__,
    __USER_CONSUME_CARD__: __USER_CONSUME_CARD__,
    __EVER_GET_CARD__: __EVER_GET_CARD__,
    __FETCH_BUSINESS_LIST__: __FETCH_BUSINESS_LIST__,
    __FETCH_ONLINE_BUSINESS_LIST__: __FETCH_ONLINE_BUSINESS_LIST__,
    __FETCH_BUSINESS__: __FETCH_BUSINESS__,
    __FETCH_REL_BUSINESS_PRODUCT__: __FETCH_REL_BUSINESS_PRODUCT__,
    __FETCH_REL_BUSINESS_MATERIAL__: __FETCH_REL_BUSINESS_MATERIAL__,
    __ADD_BUSINESS__: __ADD_BUSINESS__,
    __ADD_REL_BUSINESS_PRODUCT__: __ADD_REL_BUSINESS_PRODUCT__,
    __ADD_REL_BUSINESS_MATERIAL__: __ADD_REL_BUSINESS_MATERIAL__,
    __REMOVE_BUSINESS__: __REMOVE_BUSINESS__,
    __REMOVE_REL_BUSINESS_PRODUCT__: __REMOVE_REL_BUSINESS_PRODUCT__,
    __REMOVE_REL_BUSINESS_MATERIAL__: __REMOVE_REL_BUSINESS_MATERIAL__,
    __UPDATE_BUSINESS_STATUS__: __UPDATE_BUSINESS_STATUS__
};