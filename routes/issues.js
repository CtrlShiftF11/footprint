var express = require('express');
var router = express.Router();
var issue = require('../models/issue');

router.post('/', function (req, res, next) {
    issue.getJiraIssues(req.body, function (success) {
        if (success) {
            issue.getIssues(req.body, function (issueList) {
                res.json(issueList);
            });
        }
    });
});

module.exports = router;
