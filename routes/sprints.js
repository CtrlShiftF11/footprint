var express = require('express');
var router = express.Router();
var sprint = require('../models/sprint');

router.get('/sprintsbyrapidboard/:rapidBoardId', function (req, res, next) {
    sprint.getJiraSprintsByRapidBoardId(req.params, function (sprintList) {
        res.json(sprintList);
    });
});

module.exports = router;