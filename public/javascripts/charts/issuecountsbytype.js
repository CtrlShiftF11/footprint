function getIssueTypeCounts(params, chartTitle, renderTarget) {
    $.ajax({
        url: "/issues/getissuetypecounts",
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(params)
    })
        .done(function (issueCounts) {
            renderIssueTypeCountPieChart(issueCounts, chartTitle, renderTarget);
        });
}

function renderIssueTypeCountPieChart(issueCounts, chartTitle, renderTarget) {
    var chartOptions = {
        chart: {
            renderTo: renderTarget,
            type: 'pie',
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }
        },
        credits: {
            enabled: false
        },
        title: {
            text: chartTitle
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                depth: 35,
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    },
                    connectorColor: 'silver'
                }
            }
        },
        series: [
            {
                type: 'pie',
                name: 'Issue Types',
                data: []
            }
        ]
    };
    for (var i = 0; i < issueCounts.length; i++) {
        chartOptions.series[0].data.push({name: issueCounts[i]["name"], y: parseFloat(issueCounts[i]["issue_count"])});
    }
    var chart = new Highcharts.Chart(chartOptions);
}