var https = require('https');
var httpSync = require('http-sync');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var issueModels = {};

issueModels.getIssueTypeCounts = function (params, callback) {
    var qry = "SELECT		a.project_id, a.issue_type_id, b.name, COUNT(*) AS issue_count ";
    qry += "FROM		    issue a ";
    qry += "INNER JOIN		issue_type b ";
    qry += "ON				b.id = a.issue_type_id ";
    qry += "WHERE		    a.project_id = :project_id ";
    qry += "GROUP BY		a.project_id, a.issue_type_id, b.name ";
    qry += "ORDER BY		issue_count DESC";
    sequelize.query(qry, {replacements: {project_id: params.projectId}, type: sequelize.QueryTypes.SELECT}).then(function (results) {
        callback(results);
    });
}

issueModels.getIssues = function getIssues(params, callback) {
    var qry = "SELECT   id, self, key, summary, epic_key, team_id, issue_type_id, description, project_id, updated, created, status_id, story_points, resolution_date ";
    qry += "FROM        issue ";
    qry += "WHERE       project_id = :project_id ";
    qry += "ORDER BY    summary";
    sequelize.query(qry, {replacements: {project_id: params.projectId}, type: sequelize.QueryTypes.SELECT}).then(function (results) {
        callback(results);
    });
};

issueModels.getFilteredIssueCounts = function getFilteredIssueCounts(params, callback) {
    var qry = "SELECT	date(updated) AS updated, COUNT(*) AS issue_count ";
    qry += "FROM		issue ";
    qry += "WHERE		project_id = :project_id ";
    if (typeof params.statusFilterType !== 'undefined' && params.statusFilterType === 'NOT IN') {
        qry += "AND         status_id NOT IN (" + params.statusId.join(',') + ") ";
    }
    else {
        qry += "AND         status_id IN (" + params.statusId.join(',') + ") ";
    }
    if (typeof params.issueTypeId !== 'undefined') {
        qry += "AND         issue_type_id IN (" + params.issueTypeId.join(',') + ") ";
    }
    qry += "GROUP BY	date(updated) ";
    qry += "ORDER BY 	date(updated) ASC ";
    sequelize.query(qry, {replacements: {project_id: params.projectId}, type: sequelize.QueryTypes.SELECT}).then(function (results) {
        callback(results);
    });
};

//ProjectId is Required but EpicId is an optional filter parameter
issueModels.getJiraIssues = function getJiraIssues(params, callback) {
    var startAt = 0;
    var maxResults = 100;
    var options = setGetterOptions(params, startAt, maxResults);
    sourceAndLoadJiraIssues(options, true, function (totalIssues) {
        console.log('There are ' + totalIssues + ' for project ' + params.projectId);
        if (totalIssues > maxResults) {
            var itWorked = false;
            for (var i = (maxResults + 1); i < totalIssues; i = (i + maxResults)) {
                console.log('inside the caller - i is now equal to ' + i);
                options = setGetterOptions(params, i, maxResults);
                itWorked = sourceAndLoadJiraIssues(options, false, function (itWorked) {
                    if (!itWorked) {
                        callback(false);
                    }
                });
            }
            callback(itWorked);
        }
    });

    function setGetterOptions(params, startAt, maxResults) {
        if (typeof params.sort === 'undefined') {
            var jqlSort = 'ORDER BY summary ASC';
        }
        else {
            if (typeof params.sortDir === 'undefined') {
                params.sortDir = 'ASC';
            }
            var jqlSort = 'ORDER BY ' + params.sort + ' ' + params.sortDir;
        }
//        var jql = 'project=' + params.projectId + ' AND issuetype=Story';
//        if (!typeof params.epicKey === 'undefined') {
//            jql += ' AND ' + jira.epicIssueKeyJQLFieldId + '=' + params.epicKey;
//        }
        var jql = 'issuetype="Refactor Story"';
        var fields = 'project,issuetype,id,key,summary,description,status,issuetype,updated,created,avatarUrls,';
        fields += jira.epicIssueKeyDisplayFieldId + ',' + jira.teamDisplayFieldId + ',' + jira.storyPointsDisplayFieldId;

        return {
            host: jira.jiraHost,
            path: jira.jiraRestPath + 'search?jql=' + encodeURIComponent(jql) + '&fields=' + encodeURIComponent(fields) + '&startAt=' + startAt + '&maxResults=' + maxResults,
            //path: jira.jiraRestPath + 'search?fields=' + encodeURIComponent(fields) + '&startAt=' + startAt + '&maxResults=' + maxResults,
            auth: jira.jiraUserName + ':' + jira.jiraPassword,
            port: 443,
            keepAlive: true,
            keepAliveMsecs: 200000,
            rejectUnauthorized: false
        };
    }

    function sourceAndLoadJiraIssues(getterOptions, itFeelsLikeTheVeryFirstTime, callback) {
        if (typeof params.synchronous !== 'undefined' && params.synchronous == true) {
            var jiraReq = httpSync.request({
                method: 'GET',
                headers: {
                    Authorization: getterOptions.auth,
                    "Content-Type": "application/json"
                },
                protocol: 'https',
                host: getterOptions.host,
                path: getterOptions.path,
                port: getterOptions.port,
                rejectUnauthorized: false
            });

            var requestTimedOut = false;
            jiraReq.setTimeout(200000, function () {
                console.log('Request Timed Out');
                console.log('Unable to gather JIRA data.');
                requestTimedOut = true;
                callback(false);
            });
            var jiraRes = jiraReq.end();
            if (!requestTimedOut) {
                var insertWorked = false;
                var bodyAsObj = JSON.parse(jiraRes.body);
                if (typeof bodyAsObj["issues"] !== 'undefined') {
                    var bodyObj = bodyAsObj["issues"];
                    var insertIssueParams = {};
                    insertIssueParams.bodyObj = bodyObj;
                    insertWorked = insertIssue(insertIssueParams);
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
            try {
                var success = false;
                var body = '';
                console.log(getterOptions);
                var jiraReq = https.get(getterOptions, function (jiraRes) {
                    jiraRes.on('data', function (d) {
                        body += d;
                    });
                    jiraRes.on('end', function (e) {
                        var insertWorked = false;
                        var bodyAsObj = JSON.parse(body);
                        if (typeof bodyAsObj["issues"] !== 'undefined') {
                            var bodyObj = bodyAsObj["issues"];
                            for (var i = 0; i < bodyObj.length; i++) {
                                insertIssueParams = {};
                                insertIssueParams.bodyObj = bodyObj;
                                insertWorked = insertIssue(insertIssueParams);
                            }
                            success = true;
                        }
                        else {
                            success = true; //The call worked but returned no data from JIRA
                        }
                        jiraReq.end();
                        if (itFeelsLikeTheVeryFirstTime) {
                            callback(bodyAsObj["total"]);
                        }
                        else {
                            callback(success);
                        }
                    });
                    jiraRes.on('error', function (err) {
                        console.log('Unable to gather JIRA data.\n' + err.message);
                        jiraReq.end();
                        callback(false);
                    });
                });
            }
            catch (err) {
                console.log('Error: ' + err.message);
            }
        }
    }

    function insertIssue(params) {
        try {
            for (var i = 0; i < params.bodyObj.length; i++) {
                var qry = "INSERT INTO issue (id, self, key, summary, epic_key, team_id, issue_type_id, description, project_id, updated, created, status_id, story_points, resolution_date) ";
                qry += "SELECT  :id, :self, :key, :summary, :epic_key, :team_id, :issue_type_id, :description, :project_id, :updated, :created, :status_id, :story_points, :resolution_date ";
                qry += "WHERE ";
                qry += "NOT EXISTS ( ";
                qry += "SELECT  id ";
                qry += "FROM    issue ";
                qry += "WHERE   id = :id ";
                if (typeof params.epicKey !== 'undefined') {
                    qry += "AND epic_key <> :epic_key ";
                }
                qry += ");";
                var teamId = null;
                if (params.bodyObj[i]["fields"][jira.teamDisplayFieldId] != null) {
                    teamId = params.bodyObj[i]["fields"][jira.teamDisplayFieldId]["id"];
                }
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
                        status_id: params.bodyObj[i]["fields"]["status"]["id"],
                        issue_type_id: params.bodyObj[i]["fields"]["issuetype"]["id"],
                        epic_key: params.bodyObj[i]["fields"][jira.epicIssueKeyDisplayFieldId],
                        team_id: teamId,
                        story_points: params.bodyObj[i]["fields"][jira.storyPointsDisplayFieldId],
                        resolution_date: params.bodyObj[i]["fields"]["resolutiondate"]
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

module.exports = issueModels;