const __SHOPPING_CONTROLLER__ = require('../controller/shopping.controller');
const __LOGGER__ = require('../services/log4js.service').getLogger('numen.js');

function clean() {
    setInterval(() => {
        __LOGGER__.info('========================== 巡视 ==========================');
        __SHOPPING_CONTROLLER__
            .fetchOrderNotPayTimeout({}, result => {
            });
    }, 3600);
}

clean();