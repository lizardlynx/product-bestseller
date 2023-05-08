export function buildChart(id, text, source, sourceLink, yText, xText, pointStart, series) {
  Highcharts.chart(id, {

    title: {
      text,
      align: 'left'
    },
  
    subtitle: {
      text: `Ресурс: <a href="${sourceLink}" target="_blank">${source}</a>`,
      align: 'left'
    },
  
    yAxis: {
      title: {
        text: yText
      }
    },
  
    xAxis: {
      type: 'datetime',
        dateTimeLabelFormats: { // don't display the year
            month: '%e. %b',
            year: '%b'
        },
        title: {
            text: xText
        }
    },
  
    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
  
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart
      }
    },
  
    series,
  
    responsive: {
      rules: [{
        condition: {
          maxWidth: 500
        },
        chartOptions: {
          legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom'
          }
        }
      }]
    }
  
  });
}
