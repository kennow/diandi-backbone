const express = require('express');
const router = express.Router();
const __FINANCE__ = require('../controller/finance.controller');
const __LOGGER__ = require('../services/log4js.service').getLogger(__filename);

/**
 *  中债国债收益率曲线
 */
router.get('/bond/:from-:to', function (req, res, next) {
    __LOGGER__.info('========================== 中债国债收益率曲线 ==========================');
    __LOGGER__.info(req.params);
    __FINANCE__.getChinaTreasuryYields(req, function (data) {
        res.json(data);
        __LOGGER__.info('========================== end ==========================');
    });
});

module.exports = router;