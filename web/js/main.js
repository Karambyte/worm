var results = [];
var chrt = false;
var buffer = 0;

$(function () {
    $(document).ready(function () {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

        var chartOptions = {
            chart: {
                renderTo: 'chart',
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {
                    }
                }
            },
            title: {
                text: 'Live tweet data'
            },
            xAxis: {
                title: {
                    text: 'Party'
                },
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'Average Weighted Support'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: true
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: 'Conservatives',
                //data: [{x:Date.now() - 5000,y:0.6},{x:Date.now() - 3000,y:0.4}]
                data : [],
                color : "#0087DC"
            },
            {
                name: 'Labour',
                data : [],
                color : "#DC241f"
            },
            {
                name: 'UKIP',
                data : [],
                color : "#70147A"
            },
            {
                name: 'Liberal Democrats',
                data : [],
                color : "#FDBB30"
            },
            {
                name: 'SNP',
                data : [],
                color : "rgb(240, 217, 63)"
            },
            {
                name: 'DUP',
                data : [],
                color : "#D46A4C"
            },
            {
                name: 'Plaid Cymru',
                data : [],
                color : "#008142"
            },
            {
                name: 'Green Party',
                data : [],
                color : "#6AB023"
            }]
        };

        chrt = new Highcharts.Chart(chartOptions);
    });
});

function nameToSeries(party) {
    if (party == "con")
        return 0;
    else if (party == "lab")
        return 1;
    else if (party == "ukip")
        return 2;
    else if (party == "lib")
        return 3;
    else if (party == "snp")
        return 4;
    else if (party == "dup")
        return 5;
    else if (party == "plaid")
        return 6;
    else if (party == "green")
        return 7;
    else
        return 0;
}

function addData(data) {
    var x = (new Date()).getTime();
    buffer++;

    var totalData = data.total;

    $.each(totalData, function(index, obj) {
        $.each(obj, function(att, value) {
            $('.' + att + ' .total').text(value);
            $('.' + att).attr('total', value);
        })
    })

    for (var i = 0; i < data.graph.length; i++) {
        $.each(data.graph[i], function(key, val) {
            var series = chrt.series[nameToSeries(key)];
            var y = parseFloat(val);

            series.addPoint([x, y], true, (buffer > 9));

            console.log("added: ", Date.now(), val, buffer)
        });
    };
}

function sortList() {
    var listingArr = $('#results div');

    listingArr.sort(function (a, b) {
        // convert to integers from strings
        a = parseInt($(a).attr("total"), 10);
        b = parseInt($(b).attr("total"), 10);
        // compare
        if(a < b) {
            return 1;
        } else if(a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    $('#results').append(listingArr);
}


// socket.io
var socket = io('http://localhost:8081');

socket.on('update', function(data) {
    addData(data);
    sortList();
})