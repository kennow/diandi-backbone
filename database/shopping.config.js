/**
 *      - SUCCESS—支付成功                  1
 *      - REFUND—转入退款                   2
 *      - NOTPAY—未支付                     0
 *      - CLOSED—已关闭                     3
 *      - REVOKED—已撤销（刷卡支付）        4
 *      - USERPAYING--用户支付中             5
 *      - PAYERROR--支付失败(其他原因，如银行返回失败)         6
 *      - ABNORMAL--状态异常
 */
const __ENUM_ORDER_STATUS__ = {
    NOTPAY: 0,
    SUCCESS: 1,
    REFUND: 2,
    CLOSE: 3,
    REVOKED: 4,
    USERPAYING: 5,
    PAYERROR: 6,
    ABNORMAL: 7
};

/**
 *  SUCCESS     -   退款成功
 *  CHANGE      -   退款异常
 *  CLOSED      -   退款关闭
 */
const __ENUM_REFUND_STATUS__ = {
    SUBMIT: 0,
    REFUNDING: 1,
    SUCCESS: 2,
    CHANGE: 3,
    CLOSED: 4
};

module.exports = {
    __ENUM_ORDER_STATUS__: __ENUM_ORDER_STATUS__,
    __ENUM_REFUND_STATUS__: __ENUM_REFUND_STATUS__
};