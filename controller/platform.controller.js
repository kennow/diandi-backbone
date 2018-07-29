const __WX_OPEN_SERVICE__ = require('../services/wechat.open.platform/wechat.open.platform.service');
const __WX_OPEN_STRUCTURE__ = require('../services/wechat.open.platform/wechat.open.platform.structure');
const __WX_OPEN_HELPER__ = require('../services/wechat.open.platform/wechat.open.platform.helper');
const __LOGGER__ = require('../services/log4js.service').getLogger('platform.controller.js');

function receiveAuthorizationNotification(request, response) {
    __WX_OPEN_HELPER__
        .decryptMessage(
            request.query.msg_signature,
            request.query.timestamp,
            request.query.nonce,
            request.body.xml.encrypt
        )
        .then(__WX_OPEN_STRUCTURE__.parseComponentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.recordComponentVerifyTicket)
        .then(__WX_OPEN_SERVICE__.recordAuthorizationCode)
        .then(result => {
            __LOGGER__.debug(result);
        })
        .catch(error => {
            __LOGGER__.error(error);
        })
        .finally(() => {
            response('success');
        });
}

module.exports = {
    receiveAuthorizationNotification: receiveAuthorizationNotification
};

//receiveAuthorizationNotification({
//    body: {
//        xml: {
//            appid: 'wx4328d9d4893f7a2f',
//            encrypt: 'XbuNBYgetGKAQzIQrO3Y1NzuhICBcF+H1xj4UpNDcOrOEz1a/BBWVaxc9PvXEH0cLOeHdD1tj7l0WV9rNTcIYJyp5ujaEscyv7v/JDYtc9GEvo7i/60QlIEsMBlmySaTVmAFpjTxwe3n0XamFFQm3hkqOR2XhZXqo103WykTRAvwNscBVaLPjplTli7rcGcAnbQ5NGwnA6MrbJ0Sgv0dieOg1aF2j3qLq/wBQXRz5YME1iMDgr2IOr/fad7B5yUhc5JX1hlmP05cJO+LCuwikLVTFXx7kS0c36umFo5dbq286ZqFm/cV6GOi2gYBcACrOyNcBSddktyXw9DvxQZJEaJ4f91nvu6Q56XYW3uD9ahfjPi8KGXPzV0+0MY6MCeGx0fhzqiMWMtkzEdyINaFQdH3pP+pMWx1p0O6cji5sUw4Eh3Tw9NneS1LnPMPwX0y/87lsvXethfHRp2OGOQauA=='
//        }
//    },
//    query: {
//        signature: 'cf8da8d147285746176c3573e60bfaa057c622de',
//        timestamp: '1532675835',
//        nonce: '1418336492',
//        encrypt_type: 'aes',
//        msg_signature: 'f9d4b135c60bc9ac27b4e2742991a20709283078'
//    }
//}, () => {
//});

//receiveAuthorizationNotification({
//    body: {
//        xml: {
//            appid: 'wx4328d9d4893f7a2f',
//            encrypt: 'lRbeiMGknSn7wm8P9jojunfd9T1EttIItHSVqkX7ET1dfMGEy6hbaWDQgyBdk/tAYXPcjHoiXe+VrpNDGIS95FGSJF8h3CUpse45zwPzF5Xd00MpdkAEVueZaRWWVnn8oDqWLxEBtZhm3Pma/eHIdtZi9ybXtVg5a+BwKrxvjr1051eenKuUdwyBAfKDMyeIz6qBezQoO/p/C6I5k4i4AXRLNO679ZDmhyinUeCAC8pAmhkanPA2lpUKOQL2H5a+ELpzE4oLUvMKRBzVZsoDEG8qzCE4L2HsiFy8yy0l7xbOWCQJEYvV2nluTj3qfAKjwJfqHaR52KK2QmMtt7hRrKoUVz36w5kUgUfSyrlRFEtS9/Is10SADcjOJpWbYMlJWg9WChrEE+/BCB0hCRgaJH338VFa/ibVB/My9K8gRFsTSmwuK9Lr5bkO+C6gVmTbf+GGxCf512rqBzIc9SDyrE+ULhtJLZc3WWvhx6Tik0m3aWYAjh9Aey2C1oiftbxBKQe7FIsAqD9BS6QdnPChRpvvX7hZHbZxGEHmP0XZ66QIZ+YT9tAUlWBxQboEKA1+86OGzRLxj+NZdRRnCnup9DE1c7SwAjdcG/cQ5cm6+PXyd0j8Zpa2qlG7/l3WnDVQo41jP0cmmWNHtbl9hlDIe8nloOHSpdhO/EV8jE/QNZvdomd9s8ppff6e1YiT5lzjZQ/4VvgcFVz1jQfZV9DxGqOMMOrM6JqKSG+rnIx1WdOlovdoiKwuzaYan4VMbxexPt+e+aESxXQqqfvvLziFh0LqwQJMOMMvimzE5g/Aa7w='
//        }
//    },
//    query: {
//        signature: 'e79f8fe1578975d9baf90e53a41bf42ce440d7be',
//        timestamp: '1532698982',
//        nonce: '936592860',
//        encrypt_type: 'aes',
//        msg_signature: 'a4532e223b8c1ed1268231999f54c3ffe7470272'
//    }
//}, () => {
//});
