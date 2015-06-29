var jiraConn = {};
jiraConn.jiraHost = 'bees.beehive.com';
jiraConn.jiraRestPath = '/rest/api/2/';
jiraConn.jiraGreenhopperPath = '/rest/greenhopper/1.0/';
jiraConn.jiraUserName = 'myJiraUserName';
jiraConn.jiraPassword = 'myJiraPassword';
jiraConn.storyPointsJQLFieldId = "cf[10002]";
jiraConn.storyPointsDisplayFieldId = "customfield_10002";
jiraConn.teamJQLFieldId = "cf[11901]";
jiraConn.teamDisplayFieldId = "customfield_11901";
jiraConn.epicIssueKeyJQLFieldId = "cf[10600]";
jiraConn.epicIssueKeyDisplayFieldId = "customfield_10600";

module.exports = jiraConn;