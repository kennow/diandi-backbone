const __SYSTEM__ = require('../database/system.api');
const __SHOPPING__ = require('../database/shopping.api');
const __ALI_SMS__ = require('../services/aliyun.sms/aliyun.sms.service');
const __LOGGER__ = require('../services/log4js.service').getLogger('system.controller.js');

/**
 * 发送验证码
 * @param request
 * @param response
 */
function sendSMS(request, response) {
    __ALI_SMS__
        .trigger(request.body)
        .then(__SYSTEM__.addSMS)
        .then(function (result) {
            response(result);
        })
        .catch(function (exception) {
            __LOGGER__.error(exception);
            response(exception);
        });
}

// sendSMS({
//     body: {
//         phone: '18159393355'
//     }
// }, res => {
//     'use strict';
//     console.log(res);
// });

/**
 * 收到通知
 * @param request
 * @param response
 */
function receiveNotification(request, response) {
    if (request.body.hasOwnProperty('xml') && request.body.xml.hasOwnProperty('event')) {
        // 对收到的数据进行解析，判断消息类型
        // SWITCH 到相应的处理函数，整理下要提供几类处理函数
        switch (request.body.xml.event) {
            case 'user_get_card':                   //  领取卡券
                __SHOPPING__
                    .userGetCard(request.body.xml)
                    .then(function (result) {
                        response(result);
                    })
                    .catch(function (exception) {
                        __LOGGER__.error(exception);
                        response(exception);
                    });
                break;
            case 'user_pay_from_pay_cell':          //  快速买单
                __SHOPPING__
                    .userPayFromPayCell(request.body.xml)
                    .then(function (result) {
                        response(result);
                    })
                    .catch(function (exception) {
                        __LOGGER__.error(exception);
                        response(exception);
                    });
                break;
            case 'user_consume_card':               //  核销卡券
                __SHOPPING__
                    .userConsumeCard(request.body.xml)
                    .then(function (result) {
                        response(result);
                    })
                    .catch(function (exception) {
                        __LOGGER__.error(exception);
                        response(exception);
                    });
                break;
            default:
                break;
        }
    }
}

module.exports = {
    sendSMS: sendSMS,
    receiveNotification: receiveNotification
};

//receiveNotification({
//    body: {
//        xml: {
//            tousername: 'gh_23cc8c3098d7',
//            fromusername: 'oWWirwdWjfYfYHrvYBsQOg7nyL8Y',
//            createtime: '1531985563',
//            msgtype: 'event',
//            event: 'user_get_card',
//            cardid: 'pWWirwY_iHgLxsMdeP858iyD2744',
//            isgivebyfriend: '0',
//            usercardcode: '431694761244',
//            friendusername: '',
//            outerid: '0',
//            oldusercardcode: '',
//            isrestoremembercard: '0',
//            isrecommendbyfriend: '0',
//            sourcescene: 'SOURCE_SCENE_UNKNOW',
//            unionid: 'oAAAAAK9PS6s9tDaBkOYQksSk3MY'
//        }
//    }
//}, () => {
//})

//receiveNotification({
//        body: {
//            xml: {
//                tousername: 'gh_23cc8c3098d7',
//                fromusername: 'oWWirwWI1JI3-gesLZEkjBBIxMzQ',
//                createtime: '1531987826',
//                msgtype: 'event',
//                event: 'user_pay_from_pay_cell',
//                cardid: 'pWWirwY_iHgLxsMdeP858iyD2744',
//                usercardcode: '756019906946',
//                transid: '4200000135201807191430819310',
//                locationid: '215645680',
//                fee: '88',
//                originalfee: '100'
//            }
//        }
//    },
//    () => {
//    }
//);
//
//receiveNotification({
//        body: {
//            xml: {
//                tousername: 'gh_23cc8c3098d7',
//                fromusername: 'oWWirwWI1JI3-gesLZEkjBBIxMzQ',
//                createtime: '1531987826',
//                msgtype: 'event',
//                event: 'user_consume_card',
//                cardid: 'pWWirwY_iHgLxsMdeP858iyD2744',
//                usercardcode: '756019906946',
//                consumesource: 'FROM_MOBILE_HELPER',
//                outtradeno: 'W1BHaCABADDB3gQF',
//                transid: '4200000135201807191430819310',
//                locationname: '',
//                staffopenid: 'oWWirwUKYANf-v6TqFyMwWqRQ7NY',
//                verifycode: '',
//                remarkamount: '',
//                outerstr: '',
//                locationid: '215645680'
//            }
//        }
//    },
//    () => {
//    }
//);