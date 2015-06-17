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