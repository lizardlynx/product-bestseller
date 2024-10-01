class Predictions {
  sma(points, period = 8) {
    const result = [];
    for (let i = points.length - 1; i >= period - 1; i--) {
      const periodPoints = points.slice(i - period + 1, i + 1);
      const sum = periodPoints.reduce((acc, curr) => acc + curr[1], 0);
      result.push([points[i][0], sum / period]);
    }
    return result.reverse();
  }

  ema(points, period = 8) {
    const result = [];
    if (points.length < period) return [];
    const smaPointsSet = points.slice(0, period);
    let prevEma = this.sma(smaPointsSet, period)[0][1];
    const multiplier = 2 / (points.length + 1);
    for (let i = period; i < points.length; i++) {
      prevEma = points[i][1] * multiplier + prevEma * (1 - multiplier);
      result.push([points[i][0], +prevEma.toFixed(2)]);
    }
    return result;
  }

  rsi(points, period = 14) {
    const result = [];
    for (let i = period - 1; i < points.length; i++) {
      const pointsPrices = points
        .slice(i - period + 1, i + 1)
        .map(([date, price]) => price);
      const avgGain =
        pointsPrices.reduce((acc, curr, currIndex) => {
          if (currIndex == 0) return acc;
          acc += Math.max(0, curr - pointsPrices[currIndex - 1]);
          return acc;
        }, 0) / pointsPrices.length;

      const avgLoss =
        pointsPrices.reduce((acc, curr, currIndex) => {
          if (currIndex == 0) return acc;
          acc += Math.max(0, pointsPrices[currIndex - 1] - curr);
          return acc;
        }, 0) / pointsPrices.length;

      const rsi = +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2);
      result.push([points[i][0], rsi]);
    }
    return result;
  }

  leastSquares(points, period = 14) {
    const results = [];
    const n = points.length;
    let sumY = 0;
    let sumX = 0;
    let sumXY = 0;
    let sumXSq = 0;

    for (let i = 0; i < points.length; i++) {
      sumY += points[i][1];
      sumX += points[i][0];
      sumXY += points[i][0] * points[i][1];
      sumXSq += points[i][0] * points[i][0];
    }

    const m = (n * sumXY - sumX * sumY) / (n * sumXSq - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    for (let i = 0; i < points.length; i++) {
      const x = points[i][0];
      const y = m * x + b;
      results.push([x, y]);
    }
    return results;
  }

  // need to find best suited function by interpolation and extend it
  linearExtrapolation(points, period = 14) {
    const result = [];
    const leastSquaresSet = this.leastSquares(points, period);
    const [set1, set2] = leastSquaresSet.slice(-2);
    result.push(...leastSquaresSet);
    const lastX = points[points.length - 1][0];
    console.log(lastX);
    const k = (set2[1] - set1[1]) / (set2[0] - set1[0]);
    for (let i = 0; i < period; i++) {
      const x = lastX + 86400000 * (i + 1);
      const y = set1[1] + (x - set1[0]) * k;
      result.push([x, y]);
    }
    return result;
  }



  // polynomial extrapolation
  // https://en.wikipedia.org/wiki/Neville's_algorithm
  // todo rewrite
  getLagrangeInterpolationFunction(points) {
    const n = points.length - 1;

    const p = function (i, j, x) {
      if (i === j) {
        return points[i][1];
      }

      return (
        ((points[j][0] - x) * p(i, j - 1, x) +
          (x - points[i][0]) * p(i + 1, j, x)) /
        (points[j][0] - points[i][0])
      );
    };

    return function (x) {
      if (points.length === 0) {
        return 0;
      }
      return p(0, n, x);
    };
  }

  // for polynomial extrapolation (some strange results)
  lagrangeInterpolation(points, period = 14) {
    const func = this.getLagrangeInterpolationFunction(points);
    const result = [];
    const lastX = points[points.length - 1][0];
    for (let i = 0; i < points.length + period; i++) {
      const x = i >= points.length ? lastX + 86400000 * (i - points.length + 1) : points[i][0];
      const y = func(x);
      result.push([x, y]);
    } 
    return result;
  }

  
}

module.exports = new Predictions();
