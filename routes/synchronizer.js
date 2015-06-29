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
            return deferred.promise;
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
            return deferred.promise;
        }

        //This function relies on Rapid Boards!
        function syncSprints() {
            var deferred = Q.defer();
            try {
                //Get all of the Rapid Boards and loop through them and get a list of Sprints for each Rapid Board
                rapidboard.getRapidBoards(function (rapidBoardList) {
                    for (var i = 0; i < rapidBoardList.length; i++) {
                        var sprintsByRapidBoardParams = {};
                        sprintsByRapidBoardParams.rapidBoardId = rapidBoardList[i]["id"];

                        //Loop through the list of sprints and use the current Rapid Board Id and Sprint Id combination to get a Sprint Report
                        sprint.getJiraSprintsByRapidBoardId(sprintsByRapidBoardParams, function (sprintsList) {
                            var sprintReportList = [];
                            for (var j = 0; j < sprintsList.length; j++) {
                                var sprintReportParams = {};
                                sprintReportParams.rapidBoardId = sprintsByRapidBoardParams.rapidBoardId;
                                sprintReportParams.sprintId = sprintsList[j]["id"];
                                sprintReportList.push(sprintReportParams);
                                console.log('Calling Sprint Report for...\n' + 'Rapid Board ' + sprintReportParams.rapidBoardId + '\n' + 'Sprint ' + sprintReportParams.sprintId);
                                sprint.getJiraSprintReport(sprintReportParams, function (success) {
                                    console.log('successfully inserted sprint');
                                });
                            }
                        });
                    }
                    deferred.resolve('Synchronized Sprints');
                });


            }
            catch (err) {
                deferred.reject('Error:' + err.message);
            }
            return deferred.promise;
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
                            if (!success) {
                                deferred.reject('Error: Unable to Synchronize Issues!');
                            }
                        });
                    }
                    deferred.resolve('Synchronized Issues');
                });
            }
            catch (err) {
                deferred.reject('Error: ' + err.message);
            }
            return deferred.promise;
        }

        syncSprints()
            .then(function (sprintPromise) {
                console.log(sprintPromise);
                res.sendStatus(200);
            });


//        Q.all([syncIssueTypes(), syncProjects(), syncRapidBoards()])
//            .spread(function (issueTypePromise, projectPromise, rapidBoardPromise) {
//                console.log(issueTypePromise);
//                console.log(projectPromise);
//                console.log(rapidBoardPromise);
//                res.sendStatus(200); //All promises are finished and we can yield control back and end the request!
//            })
//            .then(function () {
//                syncEpics(function (epicPromise) {
//                    console.log(epicPromise);
//                });
//            }).then(function () {
//                syncSprints(function (sprintPromise) {
//                    console.log(sprintPromise);
//                });
//            }).then(function () {
//                syncIssues(function (issuePromise) {
//                    console.log(issuePromise);
//                });
//            }).then(function () {
//                res.sendStatus(200); //All promises are finished and we can yield control back and end the request!
//            })
//            .done();

    }
    else {
        res.status(500).send({ error: 'You do not have permission use this feature.'});
    }

});
module.exports = router;