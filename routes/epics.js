var express = require('express');
var router = express.Router();
var epic = require('../models/epic');

router.get('/project/:projectId', function (req, res, next) {
    epic.getJiraEpicsByProjectId(req.params, function (success) {
        if (success) {
            epic.getEpicsByProjectId(req.params, function (epicList) {
                res.json(epicList);
            });
        }
    });
});

module.exports = router;
