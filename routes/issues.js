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

router.post('/getfilteredissuecounts', function (req, res, next) {
    issue.getFilteredIssueCounts(req.body, function (issueCounts) {
        res.json(issueCounts);
    });
});

router.post('/getissuetypecounts', function (req, res, next) {
    issue.getIssueTypeCounts(req.body, function (issueCounts) {
        res.json(issueCounts);
    });
});

module.exports = router;
