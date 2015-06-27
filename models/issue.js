var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var issueModels = {};

issueModels.getIssues = function getIssues(params, callback) {
    var qry = "SELECT   id, self, key, summary, epic_key, team_id, issue_type_id, description, project_id, updated, created, status_id, story_points, resolution_date ";
    qry += "FROM        issue ";
    qry += "WHERE       project_id = :project_id ";
    qry += "ORDER BY    summary";
    sequelize.query(qry, { replacements: { project_id: params.projectId }, type: sequelize.QueryTypes.SELECT }).then(function (results) {
        callback(results);
    });
};

//ProjectId is Required but EpicId is an optional filter parameter
issueModels.getJiraIssues = function getJiraIssues(params, callback) {
    if (typeof params.sort === 'undefined') {
        var jqlSort = 'ORDER BY summary ASC';
    }
    else {
        if (typeof params.sortDir === 'undefined') {
            params.sortDir = 'ASC';
        }
        var jqlSort = 'ORDER BY ' + params.sort + ' ' + params.sortDir;
    }
    var jql = 'project=' + params.projectId + ' AND issuetype=Story';
    if (!typeof params.epicKey === 'undefined') {
        jql += ' AND ' + jira.epicIssueKeyJQLFieldId + '=' + params.epicKey;
    }
    var fields = 'project,issuetype,id,key,summary,description,status,issuetype,updated,created,avatarUrls,';
    fields += jira.epicIssueKeyDisplayFieldId + ',' + jira.teamDisplayFieldId + ',' + jira.storyPointsDisplayFieldId;
    var options = {
        host: jira.jiraHost,
        path: jira.jiraRestPath + 'search?jql=' + encodeURIComponent(jql) + '&fields=' + encodeURIComponent(fields) + '&startAt=0&maxResults=1000',
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
            console.log('issue body is...');
            console.log(bodyAsObj);
            if (typeof bodyAsObj["issues"] !== 'undefined') {
                var bodyObj = bodyAsObj["issues"];
                for (var i = 0; i < bodyObj.length; i++) {
                    var qry = "INSERT INTO issue (id, self, key, summary, epic_key, team_id, issue_type_id, description, project_id, updated, created, status_id, story_points, resolution_date) ";
                    qry += "SELECT  :id, :self, :key, :summary, :epic_key, :team_id, :issue_type_id, :description, :project_id, :updated, :created, :status_id, :story_points, :resolution_date ";
                    qry += "WHERE ";
                    qry += "NOT EXISTS ( ";
                    qry += "SELECT  id ";
                    qry += "FROM    issue ";
                    qry += "WHERE   id = :id ";
                    if (!typeof params.epicKey === 'undefined') {
                        qry += "AND epic_key <> :epic_key ";
                    }
                    qry += ");";
                    var teamId = null;
                    if (bodyObj[i]["fields"][jira.teamDisplayFieldId] != null) {
                        teamId = bodyObj[i]["fields"][jira.teamDisplayFieldId]["id"];
                    }
                    sequelize.query(qry, { replacements: { id: bodyObj[i]["id"], self: bodyObj[i]["self"], key: bodyObj[i]["key"], summary: bodyObj[i]["fields"]["summary"],
                        description: bodyObj[i]["fields"]["description"], project_id: bodyObj[i]["fields"]["project"]["id"], updated: bodyObj[i]["fields"]["updated"],
                        created: bodyObj[i]["fields"]["created"], status_id: bodyObj[i]["fields"]["status"]["id"], issue_type_id: bodyObj[i]["fields"]["issuetype"]["id"],
                        epic_key: bodyObj[i]["fields"][jira.epicIssueKeyDisplayFieldId], team_id: teamId,
                        story_points: bodyObj[i]["fields"][jira.storyPointsDisplayFieldId], resolution_date: bodyObj[i]["fields"]["resolutiondate"]},
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

module.exports = issueModels;