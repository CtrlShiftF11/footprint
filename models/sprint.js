var https = require('https');
var httpSync = require('http-sync');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var sprintModels = {};

sprintModels.getJiraSprintsByRapidBoardId = function getJiraSprintsByRapidBoardId(params, callback) {
    if (typeof params.synchronous !== 'undefined' && params.synchronous === true) {
        var jiraReq = httpSync.request({
            method: 'GET',
            headers: {
                auth: jira.jiraUserName + ':' + jira.jiraPassword
            },
            protocol: 'https',
            host: jira.jiraHost,
            path: jira.jiraGreenhopperPath + 'sprintquery/' + params.rapidBoardId,
            port: 443
        });

        var requestTimedOut = false;
        jiraReq.setTimeout(20000, function () {
            console.log('Request Timed Out');
            console.log('Unable to gather JIRA data.');
            requestTimedOut = true;
            callback(false);
        });
        var jiraRes = jiraReq.end();
        if (!requestTimedOut) {
            console.log(jiraRes.body.toString());
            if (jiraRes.body !== '') {
                var bodyAsObj = JSON.parse(jiraRes.body);
                if (typeof bodyAsObj !== 'undefined' && typeof bodyAsObj["sprints"] !== 'undefined') {
                    var bodyObj = bodyAsObj["sprints"];
                }
                else {
                    bodyObj = [];
                }
            }
            console.log(bodyObj);
            callback(bodyObj);
        }
    }
    else {
        var options = {
            host: jira.jiraHost,
            path: jira.jiraGreenhopperPath + 'sprintquery/' + params.rapidBoardId,
            auth: jira.jiraUserName + ':' + jira.jiraPassword,
            port: 443
        };
        var success = false;
        var body = '';
        var jiraReq = https.get(options, function (jiraRes) {
            jiraRes.on('data', function (d) {
                body += d;
            });
            jiraRes.on('end', function (e) {
                console.log(body);
                if (body !== '') {
                    var bodyAsObj = JSON.parse(body);
                    if (typeof bodyAsObj !== 'undefined') {
                        var bodyObj = bodyAsObj["sprints"];
                    }
                }
                else {
                    var bodyObj = [];
                }
                success = true;
                callback(bodyObj);
            });
            jiraRes.on('error', function (err) {
                console.log('Unable to gather JIRA data.\n' + err.message);
                success = false;
                callback(success);
            });
        });
        jiraReq.end();
    }

};

sprintModels.insertRapidBoardSprint = function insertRapidBoardSprint(params) {
    try {
        console.log('inside insert function rapid board is ' + params.rapidBoardId + ' and sprint is ' + params.sprintId);
        var qry = "INSERT INTO rapid_board_sprint (rapid_board_id, sprint_id) ";
        qry += "SELECT  :rapid_board_id, :sprint_id ";
        qry += "WHERE   NOT EXISTS ( ";
        qry += "SELECT  rapid_board_id, sprint_id ";
        qry += "FROM    rapid_board_sprint ";
        qry += "WHERE   rapid_board_id = :rapid_board_id ";
        qry += "AND     sprint_id = :sprint_id ";
        qry += ");"
        sequelize.query(qry, { replacements: { rapid_board_id: params.rapidBoardId, sprint_id: params.sprintId },
            type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {
            return true;
        });
    }
    catch (err) {
        console.log('Error: ' + err.message);
        return false;
    }
};

sprintModels.getJiraSprintReport = function getJiraSprintReport(params, callback) {
    if (typeof params.synchronous !== 'undefined' && params.synchronous === true) {
        var jiraReq = httpSync.request({
            method: 'GET',
//            headers: {
//                Authorization: jira.jiraUserName + ':' + jira.jiraPassword,
//                "Content-Type": "application/json"
//            },
            user: jira.jiraUserName,
            password: jira.jiraPassword,
            protocol: 'https',
            host: jira.jiraHost,
            path: jira.jiraGreenhopperPath + 'rapid/charts/sprintreport?rapidViewId=' + params.rapidBoardId + '&sprintId=' + params.sprintId,
            port: 443
        });

        var requestTimedOut = false;
        jiraReq.setTimeout(20000, function () {
            console.log('Request Timed Out');
            console.log('Unable to gather JIRA data.');
            requestTimedOut = true;
            callback(false);
        });
        var jiraRes = jiraReq.end();
        if (!requestTimedOut) {
            var insertWorked = false;
            var bodyAsObj = JSON.parse(jiraRes.body);
            if (typeof bodyAsObj["sprint"] !== 'undefined') {
                var bodyObj = bodyAsObj["sprint"];
                insertWorked = insertSprint(bodyObj);
                success = true;
            }
            callback(jiraRes);
        }
    }
    else {
        try {
            var options = {
                host: jira.jiraHost,
                path: jira.jiraGreenhopperPath + 'rapid/charts/sprintreport?rapidViewId=' + params.rapidBoardId + '&sprintId=' + params.sprintId,
                auth: jira.jiraUserName + ':' + jira.jiraPassword,
                port: 443,
                keepAlive: true,
                keepAliveMsecs: 20000
            };
            var success = false;
            var body = '';
            var jiraReq = https.get(options, function (jiraRes) {
                jiraRes.on('data', function (d) {
                    body += d;
                });
                jiraRes.on('end', function (e) {
                    var insertWorked = false;
                    var bodyAsObj = JSON.parse(body);
                    console.log('inside end event of https call...');
                    console.log(bodyAsObj);
                    console.log(bodyAsObj["sprint"]);
                    if (typeof bodyAsObj["sprint"] !== 'undefined') {
                        console.log('if condition met');
                        var bodyObj = bodyAsObj["sprint"];
                        insertWorked = insertSprint(bodyObj);
                        success = true;
                    }
                    else {
                        success = true; //The call worked but returned no data from JIRA
                    }
                    callback(success);
                });
                jiraRes.on('error', function (err) {
                    console.log('Unable to gather JIRA data.\n' + err.message);
                    success = false;
                    callback(err);
                });
            });
            jiraReq.end();
        }
        catch (err) {
            console.log('Error: ' + err.message);
        }
    }

    function insertSprint(bodyObj) {
        console.log('made it to sprint insert');
        var completeDateVal = bodyObj["completeDate"];
        if (completeDateVal == 'None') {
            completeDateVal = null;
        }
        var qry = "INSERT INTO sprint (id, sequence, name, state, start_date, end_date, complete_date) ";
        qry += "SELECT :id, :sequence, :name, :state, :start_date, :end_date, :complete_date ";
        qry += "WHERE ";
        qry += "NOT EXISTS ( ";
        qry += "SELECT  id ";
        qry += "FROM    sprint ";
        qry += "WHERE   id = :id";
        qry += ");";
        sequelize.query(qry, { replacements: { id: bodyObj["id"], sequence: bodyObj["sequence"], name: bodyObj["name"],
            state: bodyObj["state"], start_date: bodyObj["startDate"], end_date: bodyObj["endDate"], complete_date: completeDateVal },
            type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {
            return true;
        });
    }

};

module.exports = sprintModels;