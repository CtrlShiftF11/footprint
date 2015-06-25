var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var epicModels = {};

epicModels.getEpicsByProjectId = function getEpicsByProjectId(params, callback) {
    //Gather data and return to client...
    var qry = "SELECT     id, self, key, summary, description, project_id, updated, created, status_id ";
    qry += "FROM       epic ";
    qry += "WHERE      project_id = :project_id ";
    qry += "ORDER BY   summary;";
    sequelize.query(qry, { replacements: { project_id: params.projectId }, type: sequelize.QueryTypes.SELECT }).then(function (results) {
        callback(results);
    });
};

epicModels.getJiraEpicsByProjectId = function getJiraEpicsByProjectId(params, callback) {
    var jql = 'project=' + params.projectId + ' AND issuetype=Epic ORDER BY summary ASC';
    var fields = 'project,issuetype,id,key,summary,description,status,issuetype,updated,created';
    var options = {
        host: jira.jiraHost,
        path: jira.jiraRestPath + 'search?jql=' + encodeURIComponent(jql) + '&fields=' + encodeURIComponent(fields) + '&startAt=0&maxResults=500',
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
            if (body != null) {
                var bodyAsObj = JSON.parse(body);
                var bodyObj = bodyAsObj["issues"];
                //console.log(body.length);
                //console.log('here is the body');
                console.log('epic bodyObj...');
                console.log(bodyObj);
                for (var i = 0; i < bodyObj.length; i++) {
                    var qry = "INSERT INTO epic (id, self, key, summary, description, project_id, updated, created, status_id) ";
                    qry += "SELECT  :id, :self, :key, :summary, :description, :project_id, :updated, :created, :status_id ";
                    qry += "WHERE ";
                    qry += "NOT EXISTS ( ";
                    qry += "SELECT  id ";
                    qry += "FROM    epic ";
                    qry += "WHERE   id = :id";
                    qry += ");";
                    //console.log('here is the qry');
                    //console.log(qry);
                    sequelize.query(qry, { replacements: { id: bodyObj[i]["id"], self: bodyObj[i]["self"], key: bodyObj[i]["key"], summary: bodyObj[i]["fields"]["summary"],
                        description: bodyObj[i]["fields"]["description"], project_id: bodyObj[i]["fields"]["project"]["id"], updated: bodyObj[i]["fields"]["updated"],
                        created: bodyObj[i]["fields"]["created"], status_id: bodyObj[i]["fields"]["status"]["id"]},
                        type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {

                    });
                }
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

module.exports = epicModels;

