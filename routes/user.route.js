const express = require('express');
const router = express.Router();
const __LOGGER__ = require('../services/log4js.service').getLogger('user.route.js');
const __CREDENTIAL__ = require('../controller/credential.controller');

router.post('/login', function (req, res, next) {
    __LOGGER__.info('========================== Login ==========================');
    __LOGGER__.debug(req.params);
    __CREDENTIAL__.login(req, function (request) {
        res.json(request);
        __LOGGER__.info('========================== END ==========================');
    });
});

module.exports = router;