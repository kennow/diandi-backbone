/**
 * 提交订单
 * @param body              商品简单描述
 * @param detail            商品详细描述
 * @param attach            附加数据，在查询API和支付通知中原样返回，可作为自定义参数使用
 * @param totalFee          订单总金额，单位为分
 * @param productTag        订单优惠标记，使用代金券或立减优惠功能时需要的参数
 * @param sku               商品SKU
 * @param openid            trade_type=JSAPI，此参数必传，用户在商户appid下的唯一标识
 * @param consignee_no
 */
function submitOrder(body, detail, attach, totalFee, productTag, sku, openid, consignee_no) {

}