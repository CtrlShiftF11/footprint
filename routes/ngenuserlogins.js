var express = require('express');
var router = express.Router();
//var ngenUserLogins = require('../../../models/modules/ngen/ngenuserlogins');
var ngenUserLogins = require('../models/modules/ngen/ngenuserlogins');

router.post('/countbydate', function (req, res, next) {
    ngenUserLogins.getUniqueUserLoginCountByDay(req.body, function (uniqueUserLogins) {
        res.json(uniqueUserLogins);
    });
});

router.post('/countbyweek', function (req, res, next) {
    ngenUserLogins.getUniqueUserLoginCountByWeek(req.body, function (uniqueUserLogins) {
        res.json(uniqueUserLogins);
    });
});

module.exports = router;