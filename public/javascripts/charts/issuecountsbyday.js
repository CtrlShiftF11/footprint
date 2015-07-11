function getFilteredIssueCounts(params, chartTitle, renderTarget) {
    $.ajax({
        url: "/issues/getfilteredissuecounts",
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(params)
    })
        .done(function (issueCounts) {
            if (params.chartType === 'area') {
                renderIssueCountAreaChart(issueCounts, chartTitle, renderTarget);
            }

            if (params.chartType === 'bar') {
                renderIssueCountBarChart(issueCounts, chartTitle, renderTarget, params);
            }

        });
}

function renderIssueCountAreaChart(issueCounts, chartTitle, renderTarget) {
    var chartOptions = {
        chart: {
            renderTo: renderTarget,
            zoomType: 'x'
        },
        credits: {
            enabled: false
        },
        title: {
            text: chartTitle
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: 'Issues'
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },
        series: [
            {
                type: 'area',
                name: 'Resolved Issues',
                data: []
            }
        ]
    };
    for (var i = 0; i < issueCounts.length; i++) {
        //console.log(moment.utc(issueCounts[i]["updated"]).valueOf());
        chartOptions.series[0].data.push([moment.utc(issueCounts[i]["updated"]).valueOf(), parseInt(issueCounts[i]["issue_count"])]);
    }
    var chart = new Highcharts.Chart(chartOptions);
}

//THIS CHART MAY ACTUALLY BE AN INVALID MEASURE - I'M DOING SOME RESEARCH BUT FOR NOW IT WILL REMAIN DISABLED!
//function renderIssueCountBarChart(issueCounts, chartTitle, renderTarget, params) {
//    var chartOptions = {
//        chart: {
//            renderTo: renderTarget,
//            type: 'column',
//            options3d: {
//                enabled: true,
//                alpha: 15,
//                beta: 15,
//                depth: 50,
//                viewDistance: 25
//            }
//        },
//        credits: {
//            enabled: false
//        },
//        title: {
//            text: chartTitle
//        },
//        xAxis: {
//            type: 'datetime'
//        },
//        yAxis: {
//            title: params.issueTypeName
//        },
//        plotOptions: {
//            column: {
//                depth: 25
//            }
//        },
//        series: [
//            {
//                name: ' Issues',
//                data: []
//            }
//        ]
//    };
//    for (var i = 0; i < issueCounts.length; i++) {
//        //console.log(moment.utc(issueCounts[i]["updated"]).valueOf());
//        chartOptions.series[0].data.push([moment.utc(issueCounts[i]["updated"]).valueOf(), parseInt(issueCounts[i]["issue_count"])]);
//    }
//    var chart = new Highcharts.Chart(chartOptions);
//}

