const Q = require('q');
const __UTIL__ = require('util');
const __CHEERIO__ = require('cheerio');
const __HTTP_CLIENT__ = require('../http.client');
const __LOGGER__ = require('../log4js.service').getLogger(__filename);
const __API__ = require('./china.bond.api');

/**
 * 中债国债收益率曲线
 *      获取一年期及十年期国债收益率数据算出收益率差
 *      判断短期及长期信心指数
 * 数据来源： 中国人民银行官网
 * @param request
 * @returns {*}
 */
function getChinaTreasuryYields(request) {
    const deferred = Q.defer();

    __HTTP_CLIENT__.doHttpGet(__UTIL__.format(__API__.__HISTORY_QUERY__, request.from, request.to), function (result) {
        let date = [], oneYear = [], tenYear = [], children;
        // 加载网页
        const $ = __CHEERIO__.load(result, {
            xml: {
                normalizeWhitespace: true
            }
        });
        __LOGGER__.debug('网页解析是否正确: ' + $('tr', '#gjqxData').is('tr'));
        if ($('tr', '#gjqxData').is('tr')) {
            // 开始解析
            $('tr', '#gjqxData').next().each(function (i, element) {
                children = $(this).children('td');
                date[i] = children.eq(1).text();            // 日期
                oneYear[i] = children.eq(4).text();         // 一年国债
                tenYear[i] = children.eq(8).text();         // 十年国债
            });
            __LOGGER__.debug({date: date, oneYear: oneYear, tenYear: tenYear});
            deferred.resolve({code: 0, date: date, oneYear: oneYear, tenYear: tenYear});
        } else {
            __LOGGER__.error('解析过程发生错误');
            deferred.reject({code: -100, msg: '解析过程发生错误'});
        }
    });

    return deferred.promise;
}

module.exports = {
    getChinaTreasuryYields: getChinaTreasuryYields
};

//getChinaTreasuryYields({
//    params: {
//        from: '2018-01-01',
//        to: '2018-03-01'
//    }
//}).then(res => {
//    console.log(res);
//});
