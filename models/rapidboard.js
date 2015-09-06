var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var rapidBoardModels = {};

rapidBoardModels.getRapidBoards = function getRapidBoards(callback) {
    var qry = "SELECT       id, name, can_edit, sprint_support_enabled, show_days_in_column ";
    qry += "FROM        rapid_board ";
    qry += "ORDER BY    name;";
    sequelize.query(qry, {type: sequelize.QueryTypes.SELECT}).then(function (results) {
        callback(results);
    });
};

rapidBoardModels.getJiraRapidBoards = function getJiraRapidBoards(callback) {
    var options = {
        host: jira.jiraHost,
        path: jira.jiraGreenhopperPath + 'rapidview/',
        auth: jira.jiraUserName + ':' + jira.jiraPassword,
        rejectUnauthorized: false,
        port: 443
    };
    var body = '';
    var jiraReq = https.get(options, function (jiraRes) {
        jiraRes.on('data', function (d) {
            body += d;
        });
        jiraRes.on('end', function (e) {
            var bodyAsObj = JSON.parse(body);
            var bodyObj = bodyAsObj["views"];
            jiraReq.end();
            callback(bodyObj);
        });
        jiraRes.on('error', function (err) {
            console.log('Unable to gather JIRA data.\n' + err.message);
            var success = false;
            jiraReq.end();
            callback(success);
        });
    });
};

rapidBoardModels.insertRapidBoards = function insertRapidBoards(bodyObj, callback) {
    var success = false;
    for (var i = 0; i < bodyObj.length; i++) {
        var qry = "INSERT INTO rapid_board (id, name, can_edit, sprint_support_enabled, show_days_in_column) ";
        qry += "SELECT  :id, :name, :can_edit, :sprint_support_enabled, :show_days_in_column ";
        qry += "WHERE ";
        qry += "NOT EXISTS ( ";
        qry += "SELECT  id ";
        qry += "FROM    rapid_board ";
        qry += "WHERE   id = :id";
        qry += ");";
        sequelize.query(qry, {
            replacements: {
                id: bodyObj[i]["id"], name: bodyObj[i]["name"], can_edit: bodyObj[i]["canEdit"],
                sprint_support_enabled: bodyObj[i]["sprintSupportEnabled"], show_days_in_column: bodyObj[i]["showDaysInColumn"]
            },
            type: sequelize.QueryTypes.INSERT
        }).spread(function (results, metadata) {

        });
    }
    success = true;
    callback(true);
};

module.exports = rapidBoardModels;