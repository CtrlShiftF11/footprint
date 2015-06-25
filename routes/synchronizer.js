var express = require('express');
var router = express.Router();
var Q = require('q');
var jira = require('../config/jiraconfig');
var issuetype = require('../models/issuetype');
var project = require('../models/project');
var rapidboard = require('../models/rapidboard');
var epic = require('../models/epic');
var issue = require('../models/issue');
var sprint = require('../models/sprint');

router.post('/', function (req, res, next) {
    if (req.body.adminUserName == jira.jiraUserName && req.body.adminPassword == jira.jiraPassword) {
        function syncIssueTypes() {
            var deferred = Q.defer();
            issuetype.getJiraIssueTypes(function (success) {
                if (success) {
                    deferred.resolve('Synchronized Issue Types');
                }
                else {
                    deferred.reject(new Error('Error Synchronizing JIRA Issue Types'));
                }
            });
            return deferred.promise;
        }

        function syncProjects() {
            var deferred = Q.defer();
            project.getJiraProjects(function (success) {
                if (success) {
                    deferred.resolve('Synchronized Projects');
                }
                else {
                    deferred.reject(new Error('Error Synchronizing JIRA Projects'));
                }
            });
            return deferred.promise;
        }

        function syncRapidBoards() {
            var deferred = Q.defer();
            rapidboard.getJiraRapidBoards(function (success) {
                if (success) {
                    deferred.resolve('Synchronized Rapid Boards');
                }
                else {
                    deferred.reject(new Error('Error Synchronizing JIRA Rapid Boards'));
                }
            });
        }

        //This function is contingent upon completion of gathering JIRA Projects first!
        //Under construction!
        function syncEpics() {
            var deferred = Q.defer();
            try {
                project.getProjects(function (projectList) {
                    for (var i = 0; i < projectList.length; i++) {
                        var params = {};
                        params.projectId = projectList[i]["id"];
                        epic.getJiraEpicsByProjectId(params, function (success) {
                        });
                    }
                    deferred.resolve('Synchronized Epics');
                });
            }
            catch (err) {
                deferred.reject('Error:' + err.message);
            }
        }

        //This function relies on Rapid Boards!
        function syncSprints() {
            var deferred = Q.defer();
            try {
                rapidboard.getRapidBoards(function (rapidBoardList) {
                    for (var i = 0; i < rapidBoardList.length; i++) {
                        var params = {};
                        params.projectId = projectList[i]["id"];
                        sprint.getJiraSprintReport(params, function (success) {
                        });
                    }
                    deferred.resolve('Synchronized Sprints');
                });
            }
            catch (err) {
                deferred.reject('Error:' + err.message);
            }
        }

        //This function should be called last as it has foreign keys pointing all over earth
        function syncIssues() {
            var deferred = Q.defer();
            try {
                project.getProjects(function (projectList) {
                    for (var i = 0; i < projectList.length; i++) {
                        var params = {};
                        params.projectId = projectList[i]["id"];
                        issue.getJiraIssues(params, function (success) {
                        });
                    }
                    deferred.resolve('Synchronized Issues');
                });
            }
            catch (err) {
                deferred.reject('Error:' + err.message);
            }
        }

        Q.all([syncIssueTypes(), syncProjects(), syncRapidBoards()])
            .spread(function (issueTypePromise, projectPromise, rapidBoardPromise) {
                console.log(issueTypePromise);
                console.log(projectPromise);
                console.log(rapidBoardPromise);
            }).then(function () {
                syncEpics();
            }).then(function () {
                syncSprints();
            }).then(function () {
                syncIssues();
            }).then(function () {
                res.sendStatus(200);
            })
            .done();
    }
    else {
        res.status(500).send({ error: 'You do not have permission use this feature.'});
    }
});

module.exports = router;