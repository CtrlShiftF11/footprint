var https = require('https');
var httpSync = require('http-sync');
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
    sequelize.query(qry, {replacements: {project_id: params.projectId}, type: sequelize.QueryTypes.SELECT}).then(function (results) {
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
            for (var i = (maxResults + 1); i < totalEpics; i = (i + maxResults)) {
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
        console.log('project id is ' + params.projectId);
        var jql = 'project=' + params.projectId + ' AND issuetype=Epic ORDER BY summary ASC';
        var fields = 'project,issuetype,id,key,summary,description,status,issuetype,updated,created';
        return {
            host: jira.jiraHost,
            path: jira.jiraRestPath + 'search?jql=' + encodeURIComponent(jql) + '&fields=' + encodeURIComponent(fields) + '&startAt=' + startAt + '&maxResults=' + maxResults,
            auth: jira.jiraUserName + ':' + jira.jiraPassword,
            port: 443,
            keepAlive: true,
            rejectUnauthorized: false
        };
    }

    function sourceAndLoadJiraEpics(getterOptions, itFeelsLikeTheVeryFirstTime, callback) {
        if (typeof params.synchronous !== 'undefined' && params.synchronous == true) {
            console.log(getterOptions.path);
            var jiraReq = httpSync.request({
                method: 'GET',
                user: jira.jiraUserName,
                password: jira.jiraPassword,
                protocol: 'https',
                host: getterOptions.host,
                path: getterOptions.path,
                port: getterOptions.port
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
                console.log('JIRA RES LOOKS LIKE...');
                console.log(jiraRes);
                var insertWorked = false;
                var bodyAsObj = JSON.parse(jiraRes.body);
                console.log(bodyAsObj);
                console.log('INSIDE OF THE EPIC SYNC HANDLER...');
                if (typeof bodyAsObj["issues"] !== 'undefined') {
                    var bodyObj = bodyAsObj["issues"];
                    var insertEpicParams = {};
                    insertEpicParams.bodyObj = bodyObj;
                    insertWorked = insertEpic(insertEpicParams);
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
            }
        }
        else {
            var success = false;
            var body = '';
            var jiraReq = https.get(getterOptions, function (jiraRes) {
                jiraRes.on('data', function (d) {
                    body += d;
                });
                jiraRes.on('end', function (e) {
                    var insertWorked = false;
                    var bodyAsObj = JSON.parse(body);
                    if (typeof bodyAsObj["issues"] !== 'undefined') {
                        var bodyObj = bodyAsObj["issues"];
                        insertEpicParams = {};
                        insertEpicParams.bodyObj = bodyObj;
                        insertWorked = insertEpic(insertEpicParams);
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
            jiraReq.end();
        }
    }

    function insertEpic(params) {
        try {
            for (var i = 0; i < params.bodyObj.length; i++) {
                var qry = "INSERT INTO epic (id, self, key, summary, description, project_id, updated, created, status_id) ";
                qry += "SELECT  :id, :self, :key, :summary, :description, :project_id, :updated, :created, :status_id ";
                qry += "WHERE ";
                qry += "NOT EXISTS ( ";
                qry += "SELECT  id ";
                qry += "FROM    epic ";
                qry += "WHERE   id = :id";
                qry += ");";
                sequelize.query(qry, {
                    replacements: {
                        id: params.bodyObj[i]["id"],
                        self: params.bodyObj[i]["self"],
                        key: params.bodyObj[i]["key"],
                        summary: params.bodyObj[i]["fields"]["summary"],
                        description: params.bodyObj[i]["fields"]["description"],
                        project_id: params.bodyObj[i]["fields"]["project"]["id"],
                        updated: params.bodyObj[i]["fields"]["updated"],
                        created: params.bodyObj[i]["fields"]["created"],
                        status_id: params.bodyObj[i]["fields"]["status"]["id"]
                    },
                    type: sequelize.QueryTypes.INSERT
                }).spread(function (results, metadata) {
                    return true;
                });
            }
        }
        catch (err) {
            console.log('Error: ' + err.message);
            return false;
        }
    }
};

module.exports = epicModels;

