const express = require('express');
const router = express.Router();

/**
 *   鉴权
 */
router.get('/', function (req, res, next) {
    __LOGGER__.info('========================== STS ==========================');
    __LOGGER__.debug(req.params);


    //__USER__.login(req, function (request) {
    //    res.json(request);
    //    __LOGGER__.info('========================== END ==========================');
    //});
});

module.exports = router;