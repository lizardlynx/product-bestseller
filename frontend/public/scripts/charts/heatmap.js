export function buildHeatmap(containerId, data, categories) {
  // Substring template helper for the responsive labels
  Highcharts.Templating.helpers.substr = (s, from, length) =>
    s.substr(from, length);

  // Create the chart
  Highcharts.chart(containerId, {
    chart: {
      type: 'heatmap',
      marginTop: 40,
      marginBottom: 80,
      plotBorderWidth: 1,
    },

    title: {
      text: 'Матриця кореляції',
      style: {
        fontSize: '1em',
      },
    },

    xAxis: {
      categories,
    },

    yAxis: {
      categories,
      title: null,
      reversed: true,
    },

    accessibility: {
      point: {
        descriptionFormat:
          '{(add index 1)}. ' +
          '{series.xAxis.categories.(x)} sales ' +
          '{series.yAxis.categories.(y)}, {value}.',
      },
    },

    colorAxis: {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0],
    },

    legend: {
      align: 'right',
      layout: 'vertical',
      margin: 0,
      verticalAlign: 'top',
      y: 25,
      symbolHeight: 280,
    },

    tooltip: {
      format:
        '<b>Кореляційний кефіцієнт між {series.xAxis.categories.(point.x)}</b><br>' +
        '<b>та {series.yAxis.categories.(point.y)} </b>' +
        '<b>дорівнює {point.value} </b> <br>',
    },

    series: [
      {
        name: 'Коефіцієнт кореляції',
        borderWidth: 1,
        data,
        dataLabels: {
          enabled: true,
          color: '#000000',
        },
      },
    ],

    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500,
          },
          chartOptions: {
            yAxis: {
              labels: {
                format: '{substr value 0 1}',
              },
            },
          },
        },
      ],
    },
  });
}
