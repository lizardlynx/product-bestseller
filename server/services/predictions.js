class Predictions {
  sma(points, period) {
    const result = [];
    for (let i = points.length - 1; i >= period - 1; i--) {
      const periodPoints = points.slice(i-period + 1, i + 1);
      const sum = periodPoints.reduce((acc, curr) => acc + curr[1], 0);
      result.push([points[i][0], sum/period]);
    }
    return result.reverse();
  }

  ema(points, period) {
    const result = [];
  }
}

module.exports = new Predictions();
