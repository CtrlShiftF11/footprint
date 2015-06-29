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
    //console.log('now processing rapid board id ' + params.rapidBoardId);
    var options = {
        host: jira.jiraHost,
        path: jira.jiraGreenhopperPath + 'sprintquery/' + params.rapidBoardId,
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
};

sprintModels.getJiraSprintReport = function getJiraSprintReport(params, callback) {
    var options = {
        host: jira.jiraHost,
        path: jira.jiraGreenhopperPath + 'rapid/charts/sprintreport?rapidViewId=' + params.rapidBoardId + '&sprintId=' + params.sprintId,
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
            if (typeof bodyAsObj["sprint"] !== 'undefined') {
                var bodyObj = bodyAsObj["sprint"];
                var completeDateVal = bodyObj[0]["completeDate"];
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
                sequelize.query(qry, { replacements: { id: bodyObj[0]["id"], sequence: bodyObj[0]["sequence"], name: bodyObj[0]["name"],
                    start_date: bodyObj[0]["startDate"], end_date: bodyObj[0]["endDate"], complete_date: completeDateVal },
                    type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {

                });
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
            callback(success);
        });
    });
};

module.exports = sprintModels;