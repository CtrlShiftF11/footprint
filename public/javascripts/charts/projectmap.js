function getIssueCountsByProject(renderTarget) {
    $.getJSON('projects/issuecounts')
        .done(function (projects) {
            var projectData = [];
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].total_issues > 0) {
                    var project = {};
                    project.id = 'projectId' + projects[i].id;
                    project.name = projects[i].name;
                    project.value = parseInt(projects[i].total_issues);
                    project.colorValue = parseInt(projects[i].total_issues);
                    projectData.push(project);
                }
            }
            renderProjectMap(projectData, 'Issue Count', renderTarget);
        });
}

function renderProjectMap(projectData, mapType, renderTarget) {
    var chartOptions = {
        chart: {
            renderTo: renderTarget
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        title: {
            text: 'Projects by ' + mapType
        },
        colorAxis: {
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function () {
                            //area chart for resolved issues over time
                            var closedStatusParams = {};
                            closedStatusParams.chartType = 'area';
                            closedStatusParams.projectId = this.id.replace('projectId', '');
                            closedStatusParams.statusId = [5, 6, 10057]; //Closed, Resolved, etc. statuses - replace this test code with true reference to subsidiary table
                            getFilteredIssueCounts(closedStatusParams, 'Resolved Issues - ' + this.name, 'resolvedIssues');

//THIS MAY BE AN INVALID MEASURE AND I'M DISABLING IT PENDING FURTHER INVESTIGATION AND RESEARCH!
                            //3d bar chart for open stories
//                            var openStatusParams = {};
//                            openStatusParams.chartType = 'bar';
//                            openStatusParams.projectId = this.id.replace('projectId', '');
//                            openStatusParams.statusId = [5, 6, 10057];
//                            openStatusParams.statusFilterType = 'NOT IN';
//                            openStatusParams.issueTypeId = [7];
//                            openStatusParams.issueTypeName = 'Stories';
//                            getFilteredIssueCounts(openStatusParams, 'Open Issues - ' + this.name, 'openIssues');

                            //pie chart for all project issues by type
                            var allTypeParams = {};
                            allTypeParams.projectId = this.id.replace('projectId', '');
                            getIssueTypeCounts(allTypeParams, 'Issue Composition - ' + this.name, 'issuesByType');

                        }
                    }
                }
            }
        },
        series: [
            {
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: projectData,
                dataLabels: {
                    overflow: 'none'
                }
            }
        ]
    };
    var chart = new Highcharts.Chart(chartOptions);
}