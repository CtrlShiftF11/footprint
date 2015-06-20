var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var issueTypeModels = {};

issueTypeModels.getJiraIssueTypes = function getJiraIssueTypes(callback) {
    var options = {
        host: jira.jiraHost,
        path: jira.jiraRestPath + 'issuetype',
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
            //var bodyAsObj = JSON.parse(body);
            //var bodyObj = bodyAsObj["issues"];
            var bodyObj = JSON.parse(body);
            console.log(body.length);
            console.log('here is the body');
            console.log(bodyObj);
            for (var i = 0; i < bodyObj.length; i++) {
                var qry = "INSERT INTO issue_type (id, self, name, subtask, description, icon_url) ";
                qry += "SELECT  :id, :self, :name, :subtask, :description, :icon_url ";
                qry += "WHERE ";
                qry += "NOT EXISTS ( ";
                qry += "SELECT  id ";
                qry += "FROM    issue_type ";
                qry += "WHERE   id = :id";
                qry += ");";
                sequelize.query(qry, { replacements: { id: bodyObj[i]["id"], self: bodyObj[i]["self"], name: bodyObj[i]["name"], subtask: bodyObj[i]["subtask"],
                    description: bodyObj[i]["description"], icon_url: bodyObj[i]["iconUrl"]},
                    type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {

                });
            }
            success = true;
            callback(success);
        });
        jiraRes.on('error', function (err) {
            console.log('Unable to gather JIRA data.\n' + err.message);
            success = false;
            callback(success);
        });
    });
};

module.exports = issueTypeModels;