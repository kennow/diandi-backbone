/**
 * 卡券类别
 */
const __CARD_TYPE__ = {
    CARD_TYPE_GROUPON: 'CARD_TYPE_GROUPON',         //  团购券
    CARD_TYPE_DISCOUNT: 'CARD_TYPE_DISCOUNT',       //  折扣券
    CARD_TYPE_GIFT: 'CARD_TYPE_GIFT',               //  兑换券
    CARD_TYPE_CASH: 'CARD_TYPE_CASH',               //  代金券
    CARD_TYPE_GENERAL_COUPON: 'CARD_TYPE_GENERAL_COUPON',         //  优惠券
};

/**
 * 码型
 */
const __CODE_TYPE__ = {
    CODE_TYPE_TEXT: 'CODE_TYPE_TEXT',                   //  文本
    CODE_TYPE_BARCODE: 'CODE_TYPE_BARCODE',             //  一维码
    CODE_TYPE_QRCODE: 'CODE_TYPE_QRCODE',               //  二维码
    CODE_TYPE_ONLY_QRCODE: 'CODE_TYPE_ONLY_QRCODE',     //  二维码无code显示
    CODE_TYPE_ONLY_BARCODE: 'CODE_TYPE_ONLY_BARCODE',   //  一维码无code显示
    CODE_TYPE_NONE: 'CODE_TYPE_NONE'                    //   不显示code和条形码类型
};

/**
 * 使用时间的类型
 */
const __DATE_TYPE__ = {
    DATE_TYPE_FIX_TIME_RANGE: 'DATE_TYPE_FIX_TIME_RANGE',       //  表示固定日期区间
    DATE_TYPE_FIX_TERM: 'DATE_TYPE_FIX_TERM'                    //  表示固定时长 （自领取后按天算）
};

/**
 * 商家服务类型
 */
const __BUSINESS_SERVICE__ = {
    BIZ_SERVICE_DELIVER: 'BIZ_SERVICE_DELIVER',                 //  外卖服务
    BIZ_SERVICE_FREE_PARK: 'BIZ_SERVICE_FREE_PARK',             //  停车位
    BIZ_SERVICE_WITH_PET: 'BIZ_SERVICE_WITH_PET',               //  可带宠物
    BIZ_SERVICE_FREE_WIFI: 'BIZ_SERVICE_FREE_WIFI'              //   免费wifi
};

/**
 * 设置扫描二维码领取单张卡券/多张卡券
 */
const __ACTION_NAME__ = {
    QR_CARD: 'QR_CARD',
    QR_MULTIPLE_CARD: 'QR_MULTIPLE_CARD'
};

const __CARD_STATUS__ = {
    CARD_STATUS_NOT_VERIFY: 'CARD_STATUS_NOT_VERIFY',       //  待审核
    CARD_STATUS_VERIFY_FAIL: 'CARD_STATUS_VERIFY_FAIL',     //  审核失败
    CARD_STATUS_VERIFY_OK: 'CARD_STATUS_VERIFY_OK',         //  通过审核
    CARD_STATUS_DELETE: 'CARD_STATUS_DELETE',               //  卡券被商户删除
    CARD_STATUS_DISPATCH: 'CARD_STATUS_DISPATCH'            //  在公众平台投放过的卡券
};

/**
 *      基础信息
 */
function constructCardBaseInfo(request) {
    return {
        /**     必填字段        */
        logo_url: request.logo_url,         //  卡券的商户logo，建议像素为300*300。
        code_type: request.code_type,       //  码型
        brand_name: request.brand_name,     //  商户名字,字数上限为12个汉字
        title: request.title,               //  卡券名，字数上限为9个汉字
        color: request.color,               //  券颜色。按色彩规范标注填写Color010-Color100
        notice: request.notice,             //  卡券使用提醒，字数上限为16个汉字
        description: request.description,   //  卡券使用说明，字数上限为1024个汉字
        sku: request.sku,                   //  JSON结构,商品信息
        // quantity: request.quantity,         //  卡券库存的数量，上限为100,000,000
        date_info: constructCardDateType(request),              //  JSON结构,使用日期，有效期的信息


        /**     非必填字段        */
        use_custom_code: request.use_custom_code || false,      // 是否自定义Code码
        get_custom_code_mode: request.get_custom_code_mode || '',   // 填入 GET_CUSTOM_CODE_MODE_DEPOSIT 表示该卡券为预存code模式卡券
                                                                    // 须导入超过库存数目的自定义code后方可投放
                                                                    // 填入该字段后，quantity字段须为0,须导入code后再增加库存
        bind_openid: request.bind_openid || false,              //  是否指定用户领取, 通常指定特殊用户群体 投放卡券或防止刷券时选择指定用户领取
        service_phone: request.service_phone || '',                 //  客服电话
        location_id_list: request.location_id_list || [],           //  门店位置poiid 调用POI门店管理接口获取门店位置poiid 具备线下门店的商户为必填
        use_all_locations: request.use_all_locations || false,     //  设置本卡券支持全部门店，与location_id_list互斥
        center_title: request.center_title || '立即使用',          //  卡券顶部居中的按钮，仅在卡券状态正常(可以核销)时显示
        center_sub_title: request.center_sub_title || '立即享受优惠',     //  显示在入口下方的提示语 在卡券状态正常(可以核销)时显示
        center_url: request.center_url || 'pusudo.cn',              //  顶部居中的url ，仅在卡券状态正常(可以核销)时显示
        center_app_brand_user_name: request.center_app_brand_user_name || '',   //  卡券跳转的小程序的user_name，仅可跳转该公众号绑定的小程序
        center_app_brand_pass: request.center_app_brand_pass || '',             //  卡券跳转的小程序的path
        custom_url_name: request.custom_url_name || '立即使用',                 //  自定义跳转外链的入口名字
        custom_url: request.custom_url || '',                                   //  自定义跳转的URL
        custom_url_sub_title: request.custom_url_sub_title || '更多惊喜',       //  显示在入口右侧的提示语
        promotion_url_name: request.promotion_url_name || '',                   //  营销场景的自定义入口名称
        promotion_url: request.promotion_url || '',                             //  入口跳转外链的地址链接
        promotion_url_sub_title: request.promotion_url_sub_title || '',         //  显示在营销入口右侧的提示语
        promotion_app_brand_user_name: request.promotion_app_brand_user_name || '',     //  卡券跳转的小程序的user_name，仅可跳转该公众号绑定的小程序
        promotion_app_brand_pass: request.promotion_app_brand_pass || '',               //  卡券跳转的小程序的path
        get_limit: request.get_limit || 50,                  //  每人可领券的数量限制, 不填写默认为50
        use_limit: request.use_limit || 50,                  //  每人可核销的数量限制, 不填写默认为50
        can_share: request.can_share || true,               //  卡券领取页面是否可分享
        can_give_friend: request.can_give_friend || true    //  卡券是否可转赠
    };
}

/**
 *
 * @param request
 * @returns {*}
 */
function constructCardDateType(request) {
    let date_info;

    //  使用时间的类型 DATE_TYPE_FIX _TIME_RANGE 表示固定日期区间，DATETYPE FIX_TERM 表示固定时长
    switch (request.date_type) {
        case __DATE_TYPE__.DATE_TYPE_FIX_TIME_RANGE:
            date_info = {
                type: request.date_type,
                begin_timestamp: request.begin_timestamp,       //  type为DATE_TYPE_FIX_TIME_RANGE时专用，表示起用时间
                end_timestamp: request.end_timestamp,           //  表示结束时间 ， 建议设置为截止日期的23:59:59过期
                                                                //  可用于DATE_TYPE_FIX_TERM时间类型，表示卡券统一过期时间 ， 建议设置为截止日期的23:59:59过期
            };
            break;
        case __DATE_TYPE__.DATE_TYPE_FIX_TERM:
            date_info = {
                type: request.date_type,
                fixed_term: request.fixed_term,                 //  type为DATE_TYPE_FIX_TERM时专用，表示自领取后多少天内有效，不支持填写0
                fixed_begin_term: request.fixed_begin_term,     //  type为DATE_TYPE_FIX_TERM时专用，表示自领取后多少天开始生效，领取后当天生效填写0
                end_timestamp: request.end_timestamp            //  可用于DATE_TYPE_FIX_TERM时间类型，表示卡券统一过期时间
            };
            break;
        default:
            break;
    }
    return date_info;
}

/**
 *      高级字段
 */

/**
 *      使用条件
 * @param request
 * @returns {{accept_category: (*|string), reject_category: (*|string), least_cost: *, object_use_for: *, can_use_with_other_discount: (*|boolean)}}
 */
function constructCardUseCondition(request) {
    return {
        accept_category: request.accept_category,     //  指定可用的商品类目 仅用于代金券类型 填入后将在券面拼写适用于xxx
        reject_category: request.reject_category,     //  指定不可用的商品类目 仅用于代金券类型 填入后将在券面拼写不适用于xxxx
        least_cost: request.least_cost,               //  满减门槛字段 可用于兑换券和代金券 填入后将在全面拼写消费满xx元可用
        object_use_for: request.object_use_for,       //  购买xx可用类型门槛 仅用于兑换 填入后自动拼写购买xxx可用
        can_use_with_other_discount: request.can_use_with_other_discount    //  不可以与其他类型共享门槛
    };
}

/**
 *      封面摘要
 * @param request
 * @returns {{abstract: (*|string|abstract|{abstract, icon_url_list}|boolean|null), icon_url_list: (*|Array)}}
 */
function constructCardAbstract(request) {
    return {
        abstract: request.abstract,             //  封面摘要简介
        icon_url_list: request.icon_url_list,   //  封面图片列表，仅支持填入一 个封面图片链接
                                                // 上传图片接口 上传获取图片获得链接，填写非CDN链接会报错，并在此填入。 建议图片尺寸像素850*350
    };
}

/**
 *      使用时段限制
 * @param request
 * @returns {[*]}
 */
function constructCardTimeLimit(request) {
    return [{
        type: request.time_limit_type,          //  支持填入 MONDAY 周一 ~ SUNDAY 周日 此处只控制显示 不控制实际使用逻辑不填默认不显示
        begin_hour: request.time_limit_begin_hour,              //  当前type类型下的起始时间（小时）
        begin_minute: request.time_limit_begin_minute,          //  当前type类型下的起始时间（分钟）
        end_hour: request.time_limit_end_hour,                  //  当前type类型下的结束时间（小时）
        end_minute: request.time_limit_end_minute,              //  当前type类型下的结束时间（分钟）
    }];
}

/**
 *      团购券
 */
function constructCardGroupon(request) {
    return {
        'card': {
            'card_type': 'GROUPON',
            'groupon': {
                'base_info': constructCardBaseInfo(request),
                'advanced_info': {
                    'use_condition': constructCardUseCondition(request),
                    'abstract': constructCardAbstract(request),
                    'text_image_list': request.text_image_list,
                    'time_limit': constructCardTimeLimit(request),
                    'business_service': request.business_service
                },
                'deal_detail': request.deal_detail
            }
        }
    };
}

/**
 *      代金券
 */
function constructCardCash(request) {
    return {
        'card': {
            'card_type': 'CASH',
            'cash': {
                'base_info': constructCardBaseInfo(request),
                'advanced_info': {
                    'use_condition': constructCardUseCondition(request),
                    'abstract': constructCardAbstract(request),
                    'text_image_list': request.text_image_list,
                    'time_limit': constructCardTimeLimit(request),
                    'business_service': request.business_service
                },
                'least_cost': request.least_cost,
                'reduce_cost': request.reduce_cost
            }
        }
    };
}

/**
 *      折扣券
 */
function constructCardDiscount(request) {
    return {
        'card': {
            'card_type': 'DISCOUNT',
            'discount': {
                'base_info': constructCardBaseInfo(request),
                'advanced_info': {
                    'use_condition': constructCardUseCondition(request),
                    'abstract': constructCardAbstract(request),
                    'text_image_list': request.text_image_list,
                    'time_limit': constructCardTimeLimit(request),
                    'business_service': request.business_service
                },
                'discount': request.discount
            }
        }
    };
}

/**
 *      兑换券
 */
function constructCardGift(request) {
    return {
        'card': {
            'card_type': 'GIFT',
            'gift': {
                'base_info': constructCardBaseInfo(request),
                'advanced_info': {
                    'use_condition': constructCardUseCondition(request),
                    'abstract': constructCardAbstract(request),
                    'text_image_list': request.text_image_list,
                    'time_limit': constructCardTimeLimit(request),
                    'business_service': request.business_service
                },
                'gift': request.gift
            }
        }
    };
}

/**
 *      优惠券
 */
function constructCardGeneralCoupon(request) {
    return {
        'card': {
            'card_type': 'GENERAL_COUPON',
            'general_coupon': {
                'base_info': constructCardBaseInfo(request),
                'advanced_info': {
                    'use_condition': constructCardUseCondition(request),
                    'abstract': constructCardAbstract(request),
                    'text_image_list': request.text_image_list,
                    'time_limit': constructCardTimeLimit(request),
                    'business_service': request.business_service
                },
                'default_detail': request.default_detail
            }
        }
    };
}

/**
 *      创建二维码
 * 开发者可调用该接口生成一张卡券二维码供用户扫码后添加卡券到卡包
 * 自定义Code码的卡券调用接口时，POST数据中需指定code，非自定义code不需指定，指定openid同理。
 * 指定后的二维码只能被用户扫描领取一次
 * 获取二维码ticket后，开发者可用通过ticket换取二维码接口换取二维码图片详情
 * @param request
 * @returns {*}
 */
function constructCardQR(request) {
    let postData;

    switch (request.action_name) {
        case __ACTION_NAME__.QR_CARD:
            postData = {
                action_name: request.action_name,
                expire_seconds: request.expire_seconds,
                action_info: {
                    card: {
                        card_id: request.card_id,
                        code: request.code,
                        openid: request.openid,
                        is_unique_code: request.is_unique_code || false,
                        outer_str: request.outer_str || ''
                    }
                }
            };
            break;
        case __ACTION_NAME__.QR_MULTIPLE_CARD:
            postData = {
                action_name: request.action_name,
                action_info: {
                    multiple_card: {
                        card_list: request.card_list
                    }
                }
            };
            break;
        default:
            break;
    }

    return postData;
}

/**
 * 查询Code接口
 * @param request
 * @returns {{card_id: (*|string), code, check_consume: boolean}}
 */
function constructQueryCode(request) {
    return {
        card_id: request.card_id,
        code: request.code,
        check_consume: request.check_consume || true
    };
}

/**
 * 获取用户已领取卡券接口
 * @param request
 * @returns {{openid: (*|Array), card_id: *}}
 */
function constructQueryUserCardList(request) {
    return {
        openid: request.openid,
        card_id: request.card_id
    };
}

/**
 * 查看卡券详情
 * 开发者可以调用该接口查询某个card_id的创建信息、审核状态以及库存数量。
 * @param request
 * @returns {{card_id: (*|string)}}
 */
function constructQueryCardDetail(request) {
    return {
        card_id: request.card_id
    };
}

/**
 * 批量查询卡券列表
 * @param request
 * @returns {{offset: number, count: number, status_list: *}}
 */
function constructBatchQueryCardList(request) {
    return {
        offset: request.offset || 0,
        count: request.count || 50,
        status_list: request.status_list
    };
}

/**
 * 修改库存接口
 * @param request
 * @returns {{card_id: *, increase_stock_value: number, reduce_stock_value: number}}
 */
function constructModifyCardStock(request) {
    return {
        card_id: request.card_id,
        increase_stock_value: request.increase_stock_value || 0,
        reduce_stock_value: request.reduce_stock_value || 0
    };
}

/**
 * 删除卡券接口
 * @param request
 * @returns {{card_id: *}}
 */
function constructDeleteCard(request) {
    return {
        card_id: request.card_id
    };
}

/**
 * 设置卡券失效接口
 * @param request
 * @returns {{card_id: *, code, reason: string}}
 */
function constructSetCardUnavailable(request) {
    return {
        card_id: request.card_id,
        code: request.code,
        reason: request.reason || ''
    };
}

/**
 * 核销Code接口
 * @param request
 * @returns {{card_id: *, code}}
 */
function constructConsumeCard(request) {
    return {
        card_id: request.card_id,
        code: request.code
    };
}

/**
 * 设置买单接口
 * @param request
 * @returns {{card_id: *, is_open: boolean}}
 */
function constructCardPayCell(request) {
    return {
        card_id: request.card_id,
        is_open: request.is_open || true
    };
}

/**
 * 设置自助核销接口
 * @param request
 * @returns {{card_id: *, is_open: boolean}}
 */
function constructCardSelfConsumeCell(request) {
    return {
        card_id: request.card_id,
        is_open: request.is_open || true
    };
}

module.exports = {
    __CARD_TYPE__: __CARD_TYPE__,
    __CODE_TYPE__: __CODE_TYPE__,
    __DATE_TYPE__: __DATE_TYPE__,
    __BUSINESS_SERVICE__: __BUSINESS_SERVICE__,
    __CARD_STATUS__: __CARD_STATUS__,
    constructCardBaseInfo: constructCardBaseInfo,
    constructCardUseCondition: constructCardUseCondition,
    constructCardAbstract: constructCardAbstract,
    constructCardTimeLimit: constructCardTimeLimit,
    constructCardGroupon: constructCardGroupon,
    constructCardCash: constructCardCash,
    constructCardDiscount: constructCardDiscount,
    constructCardGift: constructCardGift,
    constructCardGeneralCoupon: constructCardGeneralCoupon,
    constructCardQR: constructCardQR,
    constructQueryCode: constructQueryCode,
    constructQueryUserCardList: constructQueryUserCardList,
    constructQueryCardDetail: constructQueryCardDetail,
    constructBatchQueryCardList: constructBatchQueryCardList,
    constructModifyCardStock: constructModifyCardStock,
    constructDeleteCard: constructDeleteCard,
    constructSetCardUnavailable: constructSetCardUnavailable,
    constructCardPayCell: constructCardPayCell,
    constructCardSelfConsumeCell: constructCardSelfConsumeCell,
    constructConsumeCard: constructConsumeCard
};


