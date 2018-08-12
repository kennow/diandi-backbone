const __CHINA_BOND_SERVICE__ = require('../services/china.bond/china.bond.service');

/**
 * 中债国债收益率曲线
 * @param request
 * @param response
 */
function getChinaTreasuryYields(request, response) {
    __CHINA_BOND_SERVICE__
        .getChinaTreasuryYields(request.params)
        .then(result => {
            response(result);
        })
        .catch(error => {
            response(error);
        });
}

//getChinaTreasuryYields({
//    params: {
//        from: '2018-01-01',
//        to: '2018-03-01'
//    }
//}, () => {
//});

module.exports = {
    getChinaTreasuryYields: getChinaTreasuryYields
};
