var express = require('express');
var router = express.Router();
var project = require('../models/project');

router.get('/', function (req, res, next) {
    project.getJiraProjects(function (success) {
        if (success) {
            project.getProjects(function (projectList) {
                res.json(projectList);
            });
        }
    });
});

router.get('/issuecounts', function (req, res, next) {
    project.getProjectIssueCounts(function (issueCounts) {
        res.json(issueCounts);
    });
});

module.exports = router;