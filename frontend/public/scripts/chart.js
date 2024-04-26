export function buildChart(
  id,
  text,
  source,
  sourceLink,
  yText,
  xText,
  pointStart,
  series,
  type = 'line'
) {
  Highcharts.chart(id, {
    chart: {
      type,
      labels: {
        style: {
            color: 'black'
        }
      }
    },
    title: {
      text,
      align: 'left',
    },

    subtitle: {
      text: `Ресурс: <a href="${sourceLink}" target="_blank">${source}</a>`,
      align: 'left',
    },

    yAxis: {
      title: {
        text: yText,
      },
    },

    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        // don't display the year
        month: '%e. %b',
        year: '%b',
      },
      title: {
        text: xText,
      },
    },

    legend: {
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
    },
    tooltip: {
      pointFormat: '<span style="color:{series.color}">{series.name}</span>: {point.y:,.1f} грн<br/>',
      split: true
    },

    plotOptions: {
      series: {
        label: {
          connectorAllowed: false,
        },
        pointStart,
      },
      area: {
        stacking: 'normal',
        marker: {
            enabled: false
        }
      }
    },

    series,

    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500,
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom',
            },
          },
        },
      ],
    },
  });
}
