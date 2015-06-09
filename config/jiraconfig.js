var jiraConn = {};
jiraConn.jiraHost = 'myjira.mydomain.com';
jiraConn.jiraRestPath = '/rest/api/2/';
jiraConn.jiraGreenhopperPath = '/rest/greenhopper/1.0/';
jiraConn.jiraUserName = 'myuserid';
jiraConn.jiraPassword = 'mypassword';
jiraConn.storyPointsJQLFieldId = "cf[10002]";
jiraConn.storyPointsDisplayFieldId = "customfield_10002";
jiraConn.teamJQLFieldId = "cf[11901]";
jiraConn.teamDisplayFieldId = "customfield_11901";
jiraConn.epicIssueKeyJQLFieldId = "cf[10600]";
jiraConn.epicIssueKeyDisplayFieldId = "customfield_10600";

module.exports = jiraConn;