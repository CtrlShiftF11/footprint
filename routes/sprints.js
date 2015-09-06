var express = require('express');
var router = express.Router();
var sprint = require('../models/sprint');

//Gets all Sprint Reports from local database
//State and RapidViewId filters to limit data are optional
router.get('/', function (req, res, next) {
    sprint.getSprints(req.params, function (sprintList) {
        res.json(sprintList);
    });
});

//Gets all Sprints for a given Rapid Board from JIRA's API
router.get('/sprintsbyrapidboard/:rapidBoardId', function (req, res, next) {
    sprint.getJiraSprintsByRapidBoardId(req.params, function (sprintList) {
        res.json(sprintList);
    });
});

//Insert rapid_board sprint into intersection table
router.post('/insertrapidboardsprint', function (req, res, next) {
    sprint.insertRapidBoardSprint(req.body, function (success) {
        if (success) {
            res.status(200).send();
        }
        else {
            res.status(500).send({error: 'Unable to create rapid view sprint record(s)'});
        }
    });
});

//Get a JIRA sprint report
router.get('/getsprintreport', function (req, res, next) {
    sprint.getJiraSprintReport(req.params, function (sprintReport) {
        res.json(sprintReport);
    });
});

//Insert a JIRA sprint report
router.post('/insertsprint', function (req, res, next) {
    sprint.insertSprint(sprintReport, req.body, function (success) {
        if (success) {
            res.status(200).send();
        }
        else {
            res.status(500).send({error: 'Unable to create sprint report'});
        }
    });
});

module.exports = router;