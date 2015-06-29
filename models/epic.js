var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});
var Q = require('q');

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
    var startAt = 0;
    var maxResults = 200;
    var options = setGetterOptions(params, startAt, maxResults);
    sourceAndLoadJiraEpics(options, true, function (totalEpics) {
        console.log('Total epics is ' + totalEpics);
        if (totalEpics > maxResults) {
            var itWorked = false;
            for (var i = maxResults + 1; i < totalEpics; i + maxResults) {
                options = setGetterOptions(params, i, maxResults);
                sourceAndLoadJiraEpics(options, false, function (itWorked) {
                    if (!itWorked) {
                        callback(false);
                    }
                });
            }
            callback(itWorked);
        }
    });

    function setGetterOptions(params, startAt, maxResults) {
        var jql = 'project=' + params.projectId + ' AND issuetype=Epic ORDER BY summary ASC';
        var fields = 'project,issuetype,id,key,summary,description,status,issuetype,updated,created';
        return {
            host: jira.jiraHost,
            path: jira.jiraRestPath + 'search?jql=' + encodeURIComponent(jql) + '&fields=' + encodeURIComponent(fields) + '&startAt=' + startAt + '&maxResults=' + maxResults,
            auth: jira.jiraUserName + ':' + jira.jiraPassword,
            port: 443
        };
    }

    function sourceAndLoadJiraEpics(getterOptions, itFeelsLikeTheVeryFirstTime, callback) {
        var success = false;
        var body = '';
        https.get(getterOptions, function (jiraRes) {
            jiraRes.on('data', function (d) {
                body += d;
            });
            jiraRes.on('end', function (e) {
                var bodyAsObj = JSON.parse(body);
                if (typeof bodyAsObj["issues"] !== 'undefined') {
                    var bodyObj = bodyAsObj["issues"];
                    for (var i = 0; i < bodyObj.length; i++) {
                        var qry = "INSERT INTO epic (id, self, key, summary, description, project_id, updated, created, status_id) ";
                        qry += "SELECT  :id, :self, :key, :summary, :description, :project_id, :updated, :created, :status_id ";
                        qry += "WHERE ";
                        qry += "NOT EXISTS ( ";
                        qry += "SELECT  id ";
                        qry += "FROM    epic ";
                        qry += "WHERE   id = :id";
                        qry += ");";
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
                if (itFeelsLikeTheVeryFirstTime) {
                    callback(bodyAsObj["total"]);
                }
                else {
                    callback(success);
                }
            });
            jiraRes.on('error', function (err) {
                console.log('Unable to gather JIRA data.\n' + err.message);
                callback(false);
            });
        });
    }
};

module.exports = epicModels;

