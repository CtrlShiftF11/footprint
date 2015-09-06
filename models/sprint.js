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
    var options = {
        host: jira.jiraHost,
        path: jira.jiraGreenhopperPath + 'sprintquery/' + params.rapidBoardId,
        auth: jira.jiraUserName + ':' + jira.jiraPassword,
        rejectUnauthorized: false,
        port: 443
    };
    var success = false;
    var body = '';
    console.log(options);
    var jiraReq = https.get(options, function (jiraRes) {
        jiraRes.on('data', function (d) {
            body += d;
        });
        jiraRes.on('end', function (e) {
            console.log(body);
            if (body !== '') {
                var bodyAsObj = JSON.parse(body);
                if (typeof bodyAsObj !== 'undefined') {
                    //I'm commenting this and I've decided to return the entire object which also includes the RapidViewId
                    //var bodyObj = bodyAsObj["sprints"];
                    var bodyObj = bodyAsObj;
                }
            }
            else {
                var bodyObj = [];
            }
            jiraReq.end();
            success = true;
            callback(bodyObj);
        });
        jiraRes.on('error', function (err) {
            console.log('Unable to gather JIRA data.\n' + err.message);
            jiraReq.end();
            success = false;
            callback(success);
        });
    });
};

sprintModels.insertRapidBoardSprint = function insertRapidBoardSprint(params, callback) {
    try {
        console.log('inside insert function rapid board is ' + params.rapidBoardId + ' and sprint is ' + params.sprintId);
        var qry = "INSERT INTO rapid_board_sprint (rapid_board_id, sprint_id) ";
        qry += "SELECT  :rapid_board_id, :sprint_id ";
        qry += "WHERE   NOT EXISTS ( ";
        qry += "SELECT  rapid_board_id, sprint_id ";
        qry += "FROM    rapid_board_sprint ";
        qry += "WHERE   rapid_board_id = :rapid_board_id ";
        qry += "AND     sprint_id = :sprint_id ";
        qry += ");";
        sequelize.query(qry, {
            replacements: {rapid_board_id: params.rapidBoardId, sprint_id: params.sprintId},
            type: sequelize.QueryTypes.INSERT
        }).spread(function (results, metadata) {

        });
        callback(true);
    }
    catch (err) {
        console.log('Error: \n' + err.message);
        callback(false);
    }
};

sprintModels.getJiraSprintReport = function getJiraSprintReport(params, callback) {
    try {
        var options = {
            host: jira.jiraHost,
            path: jira.jiraGreenhopperPath + 'rapid/charts/sprintreport?rapidViewId=' + params.rapidBoardId + '&sprintId=' + params.sprintId,
            auth: jira.jiraUserName + ':' + jira.jiraPassword,
            port: 443,
            rejectUnauthorized: false
        };
        var success = false;
        var body = '';
        var jiraReq = https.get(options, function (jiraRes) {
            jiraRes.on('data', function (d) {
                body += d;
            });
            jiraRes.on('end', function (e) {
                var bodyAsObj = JSON.parse(body);
                jiraReq.end();
                callback(bodyAsObj);
            });
            jiraRes.on('error', function (err) {
                console.log('Unable to gather JIRA data.\n' + err.message);
                success = false;
                jiraReq.end();
                callback(err);
            });
        });
    }
    catch (err) {
        console.log('Error: ' + err.message);
    }
};

sprintModels.insertSprint = function insertSprint(bodyObj, params, callback) {
    console.log('made it to sprint insert');
    var completeDateVal = bodyObj["completeDate"];
    if (completeDateVal == 'None') {
        completeDateVal = null;
    }
    var qry = "INSERT INTO sprint (id, sequence, name, state, start_date, end_date, complete_date, ";
    qry += "completed_issues, incompleted_issues, punted_issues, completed_issues_estimate_sum, ";
    qry += "incompleted_issues_estimate_sum, all_issues_estimate_sum, punted_issues_estimate_sum, ";
    qry += "issue_keys_added_during_sprint, rapid_board_id)";
    qry += "SELECT :id, :sequence, :name, :state, :start_date, :end_date, :complete_date, ";
    qry += ":completed_issues, :incompleted_issues, :punted_issues, :completed_issues_estimate_sum, ";
    qry += ":incompleted_issues_estimate_sum, all_issues_estimate_sum, :issue_keys_added_during_sprint, :rapid_board_id ";
    qry += "WHERE ";
    qry += "NOT EXISTS ( ";
    qry += "SELECT  id ";
    qry += "FROM    sprint ";
    qry += "WHERE   id = :id";
    qry += ");";
    sequelize.query(qry, {
        replacements: {
            id: bodyObj["id"],
            sequence: bodyObj["sequence"],
            name: bodyObj["name"],
            state: bodyObj["state"],
            start_date: bodyObj["startDate"],
            end_date: bodyObj["endDate"],
            complete_date: completeDateVal,
            completed_issues: JSON.stringify(bodyObj["contents"]["completedIssues"]),
            incompleted_issues: JSON.stringify(bodyObj["contents"]["incompletedIssues"]),
            punted_issues: JSON.stringify(bodyObj["contents"]["puntedIssues"]),
            completed_issues_estimate_sum: bodyObj["contents"]["completedIssuesEstimateSum"],
            incompleted_issues_estimate_sum: bodyObj["contents"]["incompletedIssuesEstimateSum"],
            all_issues_estimate_sum: bodyObj["contents"]["allIssuesEsimateSum"],
            issue_keys_added_during_sprint: bodyObj["contents"]["issueKeysAddedDuringSprint"],
            rapid_board_id: params.rapidBoardId
        },
        type: sequelize.QueryTypes.INSERT
    }).spread(function (results, metadata) {
        callback(true);
    });
};

sprintModels.getSprints = function getSprints(params, callback) {
    var qry = "SELECT   id, sequence, name, state, start_date, end_date, complete_date, ";
    qry += "completed_issues, incompleted_issues, punted_issues, completed_issues_estimate_sum, ";
    qry += "incompleted_issues_estimate_sum, all_issues_estimate_sum, punted_issues_estimate_sum, ";
    qry += "issue_keys_added_during_sprint, rapid_board_id ";
    qry += "FROM    sprint ";
    qry += "WHERE   1 = 1 ";
    if (typeof params.state !== 'undefined') {
        qry += "AND state = :state ";
    }
    if (typeof params.rapidBoardId !== 'undefined') {
        qry += "AND rapid_board_id = :rapidBoardId ";
    }
    qry += "ORDER BY end_date DESC";
    sequelize.query(qry, {replacements: {state: params.state, rapidBoardId: params.rapidBoardId}, type: sequelize.QueryTypes.SELECT}).then(function (results) {
        callback(results);
    });
};

module.exports = sprintModels;