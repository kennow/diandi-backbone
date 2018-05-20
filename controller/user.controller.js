const __CREDENTIAL_SERVICE__ = require('../services/wechat.mini.program/credential.service');
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


module.exports = {
    login: login,
    addConsignee: addConsignee,
    editConsignee: editConsignee,
    removeConsignee: removeConsignee,
    setAsDefaultConsignee: setAsDefaultConsignee,
    fetchMyConsignee: fetchMyConsignee,
    fetchDefaultConsignee: fetchDefaultConsignee,
    fetchMyCart: fetchMyCart,
    joinToCart: joinToCart,
    updateMyCart: updateMyCart,
    removeMyCart: removeMyCart
};

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

//fetchMyCart({
//    params: {
//        session: 's5qti4ggBiZ9AOIt7qfVuUvJq5NAc6A9'
//    }
//}, function (res) {
//    __LOGGER__.debug(res.msg)
//});

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