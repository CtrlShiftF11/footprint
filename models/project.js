var https = require('https');
var jira = require('../config/jiraconfig');
var dbconfig = require('../config/sequelizeconfig');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, {
    host: dbconfig.host,
    dialect: dbconfig.dialect
});

var projectModels = {};

projectModels.getProjects = function getProjects(callback) {
    //Gather data and return to client...
    var qry = "SELECT     id, self, key, name, avatar_urls ";
    qry += "FROM       project ";
    qry += "ORDER BY   name;";
    sequelize.query(qry, { type: sequelize.QueryTypes.SELECT }).then(function (results) {
        callback(results);
    });
};

projectModels.getJiraProjects = function getJiraProjects(callback) {
    //Connect to JIRA, query Projects and INSERT the Projects that don't already exist...
    var options = {
        host: jira.jiraHost,
        path: jira.jiraRestPath + 'project/',
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
            var bodyObj = JSON.parse(body);
            for (var i = 0; i < bodyObj.length; i++) {
                var qry = "INSERT INTO project (id, self, key, name, avatar_urls) ";
                qry += "SELECT :id, :self, :key, :name, :avatar_urls ";
                qry += "WHERE ";
                qry += "NOT EXISTS ( ";
                qry += "SELECT  id ";
                qry += "FROM    project ";
                qry += "WHERE   id = :id";
                qry += ");";
                sequelize.query(qry, { replacements: { id: bodyObj[i]["id"], self: bodyObj[i]["self"], key: bodyObj[i]["key"],
                    name: bodyObj[i]["name"], avatar_urls: JSON.stringify(bodyObj[i]["avatarUrls"])},
                    type: sequelize.QueryTypes.INSERT }).spread(function (results, metadata) {
                    //Wow - I can't believe I finally figured this out! I'm now the 3rd smartest person in Greenwood.
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

module.exports = projectModels;
