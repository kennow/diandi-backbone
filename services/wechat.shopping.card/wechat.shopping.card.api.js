const __CREATE_SHOPPING_CARD__ = 'https://api.weixin.qq.com/card/create?access_token=%s';
const __CREATE_QR_CODE__ = 'https://api.weixin.qq.com/card/qrcode/create?access_token=%s';
const __FETCH_EMBEDDED_HTML__ = 'https://api.weixin.qq.com/card/mpnews/gethtml?access_token=%s';
const __FETCH_USER_LIST__ = 'https://api.weixin.qq.com/cgi-bin/user/get?access_token=%s&next_openid=%s';
const __SET_TEST_WHITE_LIST__ = 'https://api.weixin.qq.com/card/testwhitelist/set?access_token=%s';
const __QUERY_CODE__ = 'https://api.weixin.qq.com/card/code/get?access_token=%s';
const __QUERY_USER_CARD_LIST__ = 'https://api.weixin.qq.com/card/user/getcardlist?access_token=%s';
const __QUERY_CARD_DETAIL__ = 'https://api.weixin.qq.com/card/get?access_token=%s';
const __BATCH_QUERY_CARD_LIST__ = 'https://api.weixin.qq.com/card/batchget?access_token=%s';
const __MODIFY_CARD_STOCK__ = 'https://api.weixin.qq.com/card/modifystock?access_token=%s';
const __DELETE_CARD__ = 'https://api.weixin.qq.com/card/delete?access_token=%s';
const __SET_CARD_UNAVAILABLE__ = 'https://api.weixin.qq.com/card/code/unavailable?access_token=%s';
const __SET_CARD_PAY_CELL__ = 'https://api.weixin.qq.com/card/paycell/set?access_token=%s';
const __SET_CARD_SELF_CONSUME_CELL__ = 'https://api.weixin.qq.com/card/selfconsumecell/set?access_token=%s';
const __CONSUME_CARD__ = 'https://api.weixin.qq.com/card/code/consume?access_token=%s';

module.exports = {
    __CREATE_SHOPPING_CARD__: __CREATE_SHOPPING_CARD__,
    __CREATE_QR_CODE__: __CREATE_QR_CODE__,
    __FETCH_EMBEDDED_HTML__: __FETCH_EMBEDDED_HTML__,
    __FETCH_USER_LIST__: __FETCH_USER_LIST__,
    __SET_TEST_WHITE_LIST__: __SET_TEST_WHITE_LIST__,
    __QUERY_CODE__: __QUERY_CODE__,
    __QUERY_USER_CARD_LIST__: __QUERY_USER_CARD_LIST__,
    __QUERY_CARD_DETAIL__: __QUERY_CARD_DETAIL__,
    __BATCH_QUERY_CARD_LIST__: __BATCH_QUERY_CARD_LIST__,
    __MODIFY_CARD_STOCK__: __MODIFY_CARD_STOCK__,
    __DELETE_CARD__: __DELETE_CARD__,
    __SET_CARD_UNAVAILABLE__: __SET_CARD_UNAVAILABLE__,
    __SET_CARD_PAY_CELL__: __SET_CARD_PAY_CELL__,
    __SET_CARD_SELF_CONSUME_CELL__: __SET_CARD_SELF_CONSUME_CELL__,
    __CONSUME_CARD__: __CONSUME_CARD__
};