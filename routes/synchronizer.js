var express = require('express');
var router = express.Router();
var Q = require('q');
var jira = require('../config/jiraconfig');
var issuetype = require('../models/issuetype');
var project = require('../models/project');
var epic = require('../models/epic');
var issue = require('../models/issue');
var sprint = require('../models/sprint');

router.post('/', function (req, res, next) {
    if (req.body.adminUserName == jira.jiraUserName && req.body.adminPassword == jira.jiraPassword) {
        function syncIssueTypes() {
            console.log('sync function called');
            var deferred = Q.defer();
            issuetype.getJiraIssueTypes(function (success) {
                if (success) {
                    deferred.resolve();
                }
                else {
                    deferred.reject(new Error('Error Synchronizing JIRA Issue Types'));
                }
                console.log('issue type deferred is...');
                console.log(deferred);
                return deferred.promise;
            });
        }

        function syncProjects() {
            project.getJiraProjects(function (success) {
                var deferred = Q.defer();
                issuetype.getJiraIssueTypes(function (success) {
                    if (success) {
                        deferred.resolve();
                    }
                    else {
                        deferred.reject(new Error('Error Synchronizing JIRA Projects'));
                    }
                    return deferred.promise;
                });
            });
        }

        Q.all([syncIssueTypes(), syncProjects()])
            .done(function (syncPromises) {
                res.sendStatus(200);
            });
    }
    else {
        res.status(500).send({ error: 'You do not have permission use this feature.'});
    }
});

module.exports = router;