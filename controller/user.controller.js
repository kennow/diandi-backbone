const Q = require('q');
const __CREDENTIAL_SERVICE__ = require('../services/wechat.mini.program/credential.service');
const __SYSTEM__ = require('../database/system.api');
const __USER__ = require('../database/user.api');
const __LOGGER__ = require('../services/log4js.service').getLogger('user.controller.js');

/**
 * 小程序登录
 *  小程序可以通过微信官方提供的登录能力方便地获取微信提供的用户身份标识，快速建立小程序内的用户体系。
 * @param request
 * @param response
 */
function login(request, response) {
    __CREDENTIAL_SERVICE__
        .fetchUserOpenId(request.body.code)
        .then(__USER__.wechatMiniProgramLogin)
        .then(function (result) {
            __LOGGER__.debug(result);
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *   获取缺省收件人信息
 *
 * @param request
 * @param response
 */
function fetchDefaultConsignee(request, response) {
    __USER__
        .fetchDefaultConsignee(request.params)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   我的收件人列表
 * @param request
 * @param response
 */
function fetchMyConsignee(request, response) {
    __USER__
        .fetchMyConsignee(request.params)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   设置为缺省收件人
 *
 * @param request
 * @param response
 */
function setAsDefaultConsignee(request, response) {
    __USER__
        .setAsDefaultConsignee(request)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   添加收件人
 * @param request
 * @param response
 */
function addConsignee(request, response) {
    __USER__
        .addConsignee(request)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   编辑收件人
 * @param request
 * @param response
 */
function editConsignee(request, response) {
    __USER__
        .editConsignee(request)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   删除收件人
 *
 * @param request
 * @param response
 */
function removeConsignee(request, response) {
    __USER__
        .removeConsignee(request)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   我的购物车
 *
 * @param request
 * @param response
 */
function fetchMyCart(request, response) {
    __USER__
        .fetchMyCart(request.params)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *    加入购物车
 *
 * @param request
 * @param response
 */
function joinToCart(request, response) {
    __USER__
        .joinToCart(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *    编辑我的购物车
 *
 * @param request
 * @param response
 */
function updateMyCart(request, response) {
    __USER__
        .updateMyCart(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

/**
 *   从我的购物车中移除商品
 *
 * @param request
 * @param response
 */
function removeMyCart(request, response) {
    __USER__
        .removeMyCart(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *      提交订单后，从购物车内移除要买的商品
 *
 * @param request
 * @param response
 */
function updateMyCartAfterSubmit(request, response) {
    __USER__
        .updateMyCartAfterSubmit(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   获取我的订单
 *
 * @param request
 * @param response
 */
function fetchMyOrders(request, response) {
    __USER__
        .fetchMyOrders(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *   由用户提交退款申请
 *
 * @param request
 * @param response
 */
function submitRefund(request, response) {
    __USER__
        .submitRefund(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *    获取用户资料
 *
 * @param request
 * @param response
 */
function fetchUserInfo(request, response) {
    __USER__
        .fetchUserInfo(request.body)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

/**
 *      登录后台
 *
 * @param request
 * @param response
 */
function backboneLogin(request, response) {
    __SYSTEM__
        .checkSMS(request.body)
        .then(() => {
            return Q(request.body);
        })
        .then(__USER__.checkMobile)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            response(exception);
        });
}

//fetchUserInfo({
//    body: {
//        session: 'oRKfQ0wn5FvfGsQi6BkperbYPEA5Dp3l',
//        user_id: '1',
//        consignee_no: 'hMJRqx9sG7UeNY9z3i5g6xIGQygRoFDT'
//    }
//}, res => {
//    'use strict';
//    console.log(res)
//})

//backboneLogin({
//    body: {
//        requestId: 'F3566660-E3D3-4686-803C-DC678267EA98',
//        bizId: '211609130261689467^0',
//        phone: '18159393355',
//        verificationCode: '854314'
//    }
//}, (res) => {
//    'use strict';
//    console.log(res);
//});

module.exports = {
    login: login,
    backboneLogin: backboneLogin,
    addConsignee: addConsignee,
    editConsignee: editConsignee,
    removeConsignee: removeConsignee,
    setAsDefaultConsignee: setAsDefaultConsignee,
    fetchMyConsignee: fetchMyConsignee,
    fetchDefaultConsignee: fetchDefaultConsignee,
    fetchMyCart: fetchMyCart,
    joinToCart: joinToCart,
    updateMyCart: updateMyCart,
    removeMyCart: removeMyCart,
    updateMyCartAfterSubmit: updateMyCartAfterSubmit,
    fetchMyOrders: fetchMyOrders,
    submitRefund: submitRefund,
    fetchUserInfo: fetchUserInfo
};

// submitRefund({
//     body: {
//         session: 'SPvS3DAMmXQ8E7MV4gfO53DMBwstyqDb',
//         out_trade_no: '13297414012018052516104185361753',
//         refundFee: '1',
//         totalFee: '1',
//         reason: '拍错了，不是我想要的。。。',
//         skuList: '["wnbIf9JrMH7q2bSVZLzxyP6l6NlsBbSe"]'
//     }
// }, function (result) {
//     __LOGGER__.info(result);
// });

//fetchMyOrders({
//    body: {
//        session: 'icvjmMzifEXtmnS7J8qRnkF53NbSdEQj',
//        startTime: '20180624'
//    }
//}, function (result) {
//    __LOGGER__.info(result);
//});

//updateMyCart({
//    body: {
//        session: '1xLTplWf3JUUpjMbg8rHR1d9eVIbrqNG',
//        cart: JSON.stringify([
//            {stock_no: 'gUKvRPUIP8R5LmmFm67csknO35fz2Mhl', amount: 10},
//            {stock_no: 'JZtt2fIe5UcVTo3exOqddkuZDbMgQjks', amount: 1000},
//            {stock_no: 'NoD1fgBx5ncrtWnO9wIGLf5AsxRSjfVz', amount: 100000},
//            {stock_no: 'RVwHEVMTUBOt2xRpu8l8wNHMo9g8uhi5', amount: 90},
//            {stock_no: 'wnbIf9JrMH7q2bSVZLzxyP6l6NlsBbSe', amount: 10}
//        ])
//    }
//}, function (result) {
//    __LOGGER__.info(result);
//});

//removeMyCart({
//    body: {
//        session: 'S5UNXKX4KPUlRkwqDZFKTZAygJUZXT9i',
//        stock_no: 'NoD1fgBx5ncrtWnO9wIGLf5AsxRSjfVz'
//    }
//},function (res) {
//    __LOGGER__.debug(res)
//})

// fetchMyCart({
//    params: {
//        session: 'VSoh6vxnomXFcO95DfI7kYyYQT5DSjZH'
//    }
// }, function (res) {
//    __LOGGER__.debug(res.msg)
// });

// editConsignee({
//     params: {
//         session: 'PVgFizUhKmH3EVoeqmFLsFm0QEPMqt7c'
//     },
//     body: {
//         'consignee_no': 'QRtI6giH5AR72lkrAMrW9J4rjyFKZLtc',
//         'name': '测试一',
//         'mobile': '18120955562',
//         'address': '人地要城',
//         'postcode': '112335'
//     }
// }, function (res) {
//     __LOGGER__.debug(res);
// });

// removeConsignee({
//     params: {
//         session: 'PVgFizUhKmH3EVoeqmFLsFm0QEPMqt7c'
//     },
//     body: {
//         'consignee_no': 'QRtI6giH5AR72lkrAMrW9J4rjyFKZLtc',
//     }
// }, function (res) {
//     __LOGGER__.debug(res);
// });
