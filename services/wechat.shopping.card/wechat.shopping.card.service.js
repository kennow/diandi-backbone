const Q = require('q');
const __MOMENT__ = require('moment');
const __API__ = require('./wechat.shopping.card.api');
const __UTIL__ = require('util');
const __HTTP_CLIENT__ = require('../http.client');
const __SERVICE_ACCESS_TOKEN__ = require('../wechat.access_token/wechat.access_token.service');
const __LOGGER__ = require('../log4js.service').getLogger('wechat.shopping.card.service.js');
const __STRUCTURE__ = require('./wechat.shopping.card.structure');

/**
 * 创建卡券
 *
 * 创建卡券接口是微信卡券的基础接口，用于创建一类新的卡券，获取card_id
 * 创建成功并通过审核后，商家可以通过文档提供的其他接口将卡券下发给用户，每次成功领取，库存数量相应扣除。
 *
 * 开发者须知
 *
 * 1. 需自定义Code码的商家必须在创建卡券时候，设定use_custom_code为true，且在调用投放卡券接口时填入指定的Code码。
 *    指定OpenID同理。特别注意：在公众平台创建的卡券均为非自定义Code类型。
 * 2. can_share字段指领取卡券原生页面是否可分享，建议指定Code码、指定OpenID等强限制条件的卡券填写false。
 * 3. 特别注意：编码方式仅支持使用UTF-8，否则会报错。
 * 4. 创建成功后该卡券会自动提交审核，审核结果将通过事件通知商户。
 *    开发者可调用设置白名单接口设置用户白名单，领取未通过审核的卡券，测试整个卡券的使用流程。
 * @param request
 * @returns {*|C|promise}
 */
function createShoppingCard(request) {
    const deferred = Q.defer();
    let postData;

    switch (request.card_type) {
        case 'CARD_TYPE_GROUPON':
            postData = __STRUCTURE__.constructCardGroupon(request);
            break;
        case 'CARD_TYPE_DISCOUNT':
            postData = __STRUCTURE__.constructCardDiscount(request);
            break;
        case 'CARD_TYPE_GIFT':
            postData = __STRUCTURE__.constructCardGift(request);
            break;
        case 'CARD_TYPE_CASH':
            postData = __STRUCTURE__.constructCardCash(request);
            break;
        case 'CARD_TYPE_GENERAL_COUPON':
            postData = __STRUCTURE__.constructCardGeneralCoupon(request);
            break;
        default:
            break;
    }

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__CREATE_SHOPPING_CARD__, request.access_token),
            postData,
            function (rawData) {
                let result = JSON.parse(rawData);
                if (result.errcode === 0) {
                    deferred.resolve({
                        access_token: request.access_token,
                        card_id: result.card_id,
                        action_name: 'QR_CARD',
                        expire_seconds: 1800
                    });
                } else {
                    deferred.reject(result.errmsg);
                }
            },
            null
        );

    return deferred.promise;
}

/**
 * 创建二维码接口
 * @param request
 * @returns {*|C|promise}
 */
function createQRCode(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__CREATE_QR_CODE__, request.access_token),
            __STRUCTURE__.constructCardQR(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 图文消息群发卡券
 * 支持开发者调用该接口获取卡券嵌入图文消息的标准格式代码，将返回代码填上
 * 上传图文素材接口中content字段，即可获取嵌入卡券的图文消息素材
 *
 * 特别注意：目前该接口仅支持填入非自定义code的卡券,自定义code的卡券需先进行code导入后调用
 * @param request
 * @returns {*|C|promise}
 */
function fetchEmbeddedHTML(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__FETCH_EMBEDDED_HTML__, request.access_token),
            {
                card_id: request.card_id
            },
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 获取用户列表
 * 一次拉取调用最多拉取10000个关注者的OpenID，可以通过多次拉取的方式来满足需求
 * @param request
 * @returns {*|promise|C}
 */
function fetchUserList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsGet(
            __UTIL__.format(__API__.__FETCH_USER_LIST__, request.access_token, ''),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 设置测试白名单
 * 由于卡券有审核要求，为方便公众号调试，可以设置一些测试帐号，这些帐号可领取未通过审核的卡券，体验整个流程。
 *
 * 1.同时支持“openid”、“username”两种字段设置白名单，总数上限为10个。
 * 2.设置测试白名单接口为全量设置，即测试名单发生变化时需调用该接口重新传入所有测试人员的ID.
 * 3.白名单用户领取该卡券时将无视卡券失效状态，请开发者注意。
 * @param request
 * @returns {*|C|promise}
 */
function setTestWhiteList(request) {
    const deferred = Q.defer();

    let postData = {
        'openid': [],
        'username': ['kyleinaction']
    };

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__SET_TEST_WHITE_LIST__, request.access_token),
            postData,
            function (rawData) {
                let result = JSON.parse(rawData);
                deferred.resolve(result);
            },
            null
        );

    return deferred.promise;
}

/**
 *      核销卡券
 *
 * 该部分主要介绍开发者如何在用户使用券之后让卡券从用户的微信客户端消失的过程，这个步骤称为核销。
 * 核销目前分为线上核销和线下核销两种类型。
 * 线上核销指用户从券面进入一个HTML5网页后主动销券的过程，如微信商城用券、自助核销等；
 * 线下核销指用户到店后，出示二维码或者出示串码，由收银员完成核销动作，如扫码核销、机具核销等。
 */

/**
 * 核销Code接口
 * 消耗code接口是核销卡券的唯一接口,开发者可以调用当前接口将用户的优惠券进行核销，该过程不可逆。
 * 1.仅支持核销有效状态的卡券，若卡券处于异常状态，均不可核销。
 * （异常状态包括：卡券删除、未生效、过期、转赠中、转赠退回、失效）
 * 2.**自定义Code码（use_custom_code为true）的优惠券，在code被核销时，必须调用此接口。
 * 用于将用户客户端的code状态变更。
 * 自定义code的卡券调用接口时， post数据中需包含card_id，否则报invalid serial code，非自定义code不需上报。
 * @param request
 * @returns {*|C|promise}
 */
function consumeCard(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__CONSUME_CARD__, request.access_token),
            __STRUCTURE__.constructConsumeCard(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 *      管理卡券
 */

/**
 * 查询Code接口
 * 查询code接口可以查询当前code是否可以被核销并检查code状态
 * 当前可以被定位的状态为正常、已核销、转赠中、已删除、已失效和无效code
 * @param request
 * @returns {*|promise|C}
 */
function queryCode(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__QUERY_CODE__, request.access_token),
            __STRUCTURE__.constructQueryCode(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 获取用户已领取卡券接口
 * 用于获取用户卡包里的，属于该appid下所有可用卡券，包括正常状态和异常状态。
 * @param request
 * @returns {*|promise|C}
 */
function queryUserCardList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__QUERY_USER_CARD_LIST__, request.access_token),
            __STRUCTURE__.constructQueryUserCardList(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 查看卡券详情
 * 开发者可以调用该接口查询某个card_id的创建信息、审核状态以及库存数量。
 * @param request
 * @returns {*|promise|C}
 */
function queryCardDetail(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__QUERY_CARD_DETAIL__, request.access_token),
            __STRUCTURE__.constructQueryCardDetail(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 批量查询卡券列表
 * @param request
 * @returns {*|promise|C}
 */
function batchQueryCardList(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__BATCH_QUERY_CARD_LIST__, request.access_token),
            __STRUCTURE__.constructBatchQueryCardList(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 修改库存接口
 * 调用修改库存接口增减某张卡券的库存。
 * @param request
 * @returns {*|promise|C}
 */
function modifyCardStock(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__MODIFY_CARD_STOCK__, request.access_token),
            __STRUCTURE__.constructModifyCardStock(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 删除卡券接口
 * 删除卡券接口允许商户删除任意一类卡券。
 * 删除卡券后，该卡券对应已生成的领取用二维码、添加到卡包JS API均会失效。
 * 注意：如用户在商家删除卡券前已领取一张或多张该卡券依旧有效。
 * 即删除卡券不能删除已被用户领取，保存在微信客户端中的卡券。
 * @param request
 * @returns {*|C|promise}
 */
function deleteCard(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__DELETE_CARD__, request.access_token),
            __STRUCTURE__.constructDeleteCard(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 设置卡券失效接口
 * 为满足改票、退款等异常情况，可调用卡券失效接口将用户的卡券设置为失效状态。
 * 1.设置卡券失效的操作不可逆，即无法将设置为失效的卡券调回有效状态，商家须慎重调用该接口。
 * *2.商户调用失效接口前须与顾客事先告知并取得同意，否则因此带来的顾客投诉，微信将会按照《微信运营处罚规则》
 * @param request
 * @returns {*|C|promise}
 */
function setCardUnavailable(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__SET_CARD_UNAVAILABLE__, request.access_token),
            __STRUCTURE__.constructSetCardUnavailable(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 *          快速买单
 * 微信卡券买单功能是微信卡券的一项新的能力，可以方便消费者买单时，直接录入消费金额，自动使用领到的优惠（券或卡）抵扣，并拉起微信支付快速完成付款
 * 微信买单（以下统称微信买单）的好处：
 * 1、无需商户具备微信支付开发能力，即可完成订单生成，与微信支付打通。
 * 2、可以通过手机公众号、电脑商户后台，轻松操作收款并查看核销记录，交易对账，并支持离线下载。
 * 3、支持会员营销，二次营销，如会员卡交易送积分，抵扣积分，买单后赠券等。
 */

/**
 * 设置买单接口
 * 创建卡券之后，开发者可以通过设置微信买单接口设置该card_id支持微信买单功能。
 * 值得开发者注意的是，设置买单的card_id必须已经配置了门店，否则会报错。
 *
 * 注意事项：
 * 1.设置快速买单的卡券须支持至少一家有核销员门店，否则无法设置成功；
 * 2.若该卡券设置了center_url（居中使用跳转链接）,须先将该设置更新为空后再设置自快速买单方可生效。
 * @param request
 * @returns {*|promise|C}
 */
function setCardPayCell(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__SET_CARD_PAY_CELL__, request.access_token),
            __STRUCTURE__.constructCardPayCell(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

/**
 * 设置自助核销接口
 *
 * 自助核销与扫码/输码核销互为补充
 * 卡券商户助手通过扫码/输码完成核销的同时，也确保了用券的真实性，适合有强对账需求的商户使用；
 * 而自助核销由用户发起，全程由用户操作，适合对账需求不强的商户使用。
 *
 * 目前，自助核销可能适合以下场景使用：
 * 1.不允许店员上班期间带手机；
 * 2.高峰期店内人流量大，扫码/输码核销速度不能满足短时需求；
 * 3.会议入场，短时有大量核销任务；
 *
 * 1.设置自助核销的卡券须支持至少一家门店，否则无法设置成功；
 * 2.若该卡券设置了center_url（居中使用跳转链接）,须先将该设置更新为空后再设置自助核销功能方可生效。
 * @param request
 * @returns {*|promise|C}
 */
function setCardSelfConsumeCell(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__
        .doHttpsPost(
            __UTIL__.format(__API__.__SET_CARD_SELF_CONSUME_CELL__, request.access_token),
            __STRUCTURE__.constructCardSelfConsumeCell(request),
            function (rawData) {
                deferred.resolve(JSON.parse(rawData));
            },
            null
        );

    return deferred.promise;
}

//
__SERVICE_ACCESS_TOKEN__
    .accessToken()
    .then(request => {
        const beginTimestamp = __MOMENT__().format('X');
        const endTimestamp = __MOMENT__().add(7, 'days').format('X');

        return Q({
            card_type: __STRUCTURE__.__CARD_TYPE__.CARD_TYPE_CASH,

            access_token: request.access_token,
            logo_url: 'https://warehouse.pusudo.cn/logo.png',
            brand_name: '莆素科技',
            code_type: __STRUCTURE__.__CODE_TYPE__.CODE_TYPE_QRCODE,
            title: '132元双人火锅套餐',
            color: 'Color040',
            notice: '使用时向服务员出示此券',
            description: '不可与其他优惠同享\n如需团购券发票，请在消费时向商户提出\n店内均可使用，仅限堂食',
            date_type: __STRUCTURE__.__DATE_TYPE__.DATE_TYPE_FIX_TIME_RANGE,
            begin_timestamp: beginTimestamp,
            end_timestamp: endTimestamp,
            sku: {
                'quantity': 500000
            },

            location_id_list: [
                215645680
            ],

            can_use_with_other_discount: false,
            abstract: '微信餐厅推出多种新季菜品，期待您的光临',
            icon_url_list: [
                'https://warehouse.pusudo.cn/cuisine-2248567_960_720.jpg'
            ],
            text_image_list: [
                {
                    'image_url': 'http://mmbiz.qpic.cn/mmbiz/p98FjXy8LacgHxp3sJ3vn97bGLz0ib0Sfz1bjiaoOYA027iasqSG0sjpiby4vce3AtaPu6cIhBHkt6IjlkY9YnDsfw/0',
                    'text': '此菜品精选食材，以独特的烹饪方法，最大程度地刺激食 客的味蕾'
                },
                {
                    'image_url': 'http://mmbiz.qpic.cn/mmbiz/p98FjXy8LacgHxp3sJ3vn97bGLz0ib0Sfz1bjiaoOYA027iasqSG0sj piby4vce3AtaPu6cIhBHkt6IjlkY9YnDsfw/0',
                    'text': '此菜品迎合大众口味，老少皆宜，营养均衡'
                }
            ],
            time_limit_type: 'SUNDAY',
            time_limit_begin_hour: 11,
            time_limit_begin_minute: 0,
            time_limit_end_hour: 23,
            time_limit_end_minute: 59,
            business_service: [
                __STRUCTURE__.__BUSINESS_SERVICE__.BIZ_SERVICE_DELIVER,
                __STRUCTURE__.__BUSINESS_SERVICE__.BIZ_SERVICE_FREE_PARK,
                __STRUCTURE__.__BUSINESS_SERVICE__.BIZ_SERVICE_WITH_PET,
                __STRUCTURE__.__BUSINESS_SERVICE__.BIZ_SERVICE_FREE_WIFI
            ],

            // deal_detail: '以下锅底2选1（有菌王锅、麻辣锅、大骨锅、番茄锅、清补 凉锅、酸菜鱼锅可选）：\n大锅1份 12元\n小锅2份 16元 '
            least_cost: 10000,
            reduce_cost: 500
            // discount: 30
            // gift: '可兑换音乐木盒一个'
            // default_detail: '优惠券专用，填写优惠详情'
        });
    })
    .then(createShoppingCard)
    .then(createQRCode)
    .then(res => {
        __LOGGER__.info(res);
        __LOGGER__.info(res.show_qrcode_url);
    })
    .catch(exception => {
        __LOGGER__.error(exception);
    });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pWWirwWsPaYNLDUugrmR7530EfGk',
//             action_name: 'QR_CARD',
//             expire_seconds: 1800
//         });
//     })
//     .then(createQRCode)
//     .then(res => {
//         console.log(res);
//         console.log(res.show_qrcode_url);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc'
//         });
//     })
//     .then(fetchEmbeddedHTML)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(setTestWhiteList)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc'
//         });
//     })
//     .then(queryCode)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(fetchUserList)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             openid: 'on9h6uMM3oAykSPJ0pGzx9aAQd2A',
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc'
//         });
//     })
//     .then(queryUserCardList)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc'
//         });
//     })
//     .then(queryCardDetail)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             status_list: [__STRUCTURE__.__CARD_STATUS__.CARD_STATUS_NOT_VERIFY]
//         });
//     })
//     .then(batchQueryCardList)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc',
//             increase_stock_value: 10
//         });
//     })
//     .then(modifyCardStock)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc'
//         });
//     })
//     .then(deleteCard)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc',
//             code: '222714629425'
//         });
//     })
//     .then(setCardUnavailable)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uEjxnBRBZAv-eMj1lmt8Fjc',
//             code: '371395508352'
//         });
//     })
//     .then(consumeCard)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pWWirwTXfRL0Wbz5MLnvmq75xeqY'
//         });
//     })
//     .then(setCardPayCell)
//     .then(res => {
//         console.log(res);
//     });

// __SERVICE_ACCESS_TOKEN__
//     .accessToken()
//     .then(request => {
//         return Q({
//             access_token: request.access_token,
//             card_id: 'pn9h6uFGjUi9FQ2nM7NUj7q8ENwk'
//         });
//     })
//     .then(setCardSelfConsumeCell)
//     .then(res => {
//         console.log(res);
//     });