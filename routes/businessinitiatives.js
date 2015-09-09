var express = require('express');
var router = express.Router();
var businessInit = require('../models/businessinitiative');

router.post('/businessinitiative', function (req, res, next) {
    businessInit.getBusinessInits(req.body, function (businessInitList) {
        res.json(businessInitList);
    });
});

module.exports = router;