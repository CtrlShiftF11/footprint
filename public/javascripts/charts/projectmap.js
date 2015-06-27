function getIssueCountsByProject() {
    $.getJSON('projects/issuecounts')
        .done(function (projects) {
            var projectData = [];
            for (var i = 0; i < projects.length; i++) {
                if (projects[i].total_issues > 0) {
                    var project = {};
                    project.id = 'projectId' + projects[i].id
                    project.name = projects[i].name;
                    project.value = parseInt(projects[i].total_issues);
                    project.colorValue = parseInt(projects[i].total_issues);
                    projectData.push(project);
                }
            }

            renderChart(projectData, 'Issue Count', 'projectMap');
        });
}

function renderChart(projectData, mapType, renderTarget) {
    console.log(projectData);
    var chartOptions = {
        chart: {
            renderTo: renderTarget
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
        series: [
            {
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: projectData
            }
        ]
    };
    var chart = new Highcharts.Chart(chartOptions);
}