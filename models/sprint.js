var https = require('https');
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
        path: jira.jiraGreenhopperPath + '/sprintquery/' + params.rapidBoardId,
        auth: jira.jiraUserName + ':' + jira.jiraPassword,
        port: 443
    };
    var success = false;
    var body = '';
    https.get(options, function (jiraRes) {
        jiraRes.on('data', function (d) {
            body += d;
        });
        jiraRes.on('end', function (e) {
            var bodyAsObj = JSON.parse(body);
            var bodyObj = bodyAsObj["sprints"];
            success = true;
            callback(bodyObj);
        });
        jiraRes.on('error', function (err) {
            console.log('Unable to gather JIRA data.\n' + err.message);
            success = false;
            callback(success);
        });
    });
};

sprintModels.getJiraSprintReport = function getJiraSprintReport(params, callback) {
    var options = {
        host: jira.jiraHost,
        path: jira.jiraGreenhopperPath + '/rapid/charts/sprintreport?rapidViewId=' + params.rapidBoardId + '&sprintId=' + params.sprintId,
        auth: jira.jiraUserName + ':' + jira.jiraPassword,
        port: 443
    };
    var success = false;
    var body = '';
    https.get(options, function (jiraRes) {
        jiraRes.on('data', function (d) {
            body += d;
        });
        jiraRes.on('end', function (e) {
            var bodyAsObj = JSON.parse(body);
            var bodyObj = bodyAsObj["sprints"];
            var completeDateVal = bodyObj[i]["completeDate"];
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
            sequelize.query(qry, { replacements: { id: bodyObj[i]["id"], sequence: bodyObj[i]["sequence"], name: bodyObj[i]["name"],
                start_date: bodyObj[i]["startDate"], end_date: bodyObj[i]["endDate"], complete_date: completeDateVal },
                type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {

            });
            success = true;
            callback(bodyObj);
        });
        jiraRes.on('error', function (err) {
            console.log('Unable to gather JIRA data.\n' + err.message);
            success = false;
            callback(success);
        });
    });
};

module.exports = sprintModels;