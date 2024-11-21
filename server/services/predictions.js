const { MS_IN_DAY } = require('../constants');

class Predictions {
  sma(points, period = 8) {
    const result = [];
    for (let i = points.length - 1; i >= period - 1; i--) {
      const periodPoints = points.slice(i - period + 1, i + 1);
      const sum = periodPoints.reduce((acc, curr) => acc + curr[1], 0);
      result.push([points[i][0], Number((sum / period).toFixed(2))]);
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

      let rsi = 0;
      if (avgLoss == 0) {
        rsi = 100;
      } else {
        rsi = 100 - 100 / (1 + avgGain / avgLoss);
      }

      const rsiRounded = Number(rsi.toFixed(2));
      result.push([points[i][0], rsiRounded]);
    }
    return result;
  }

  #leastSquares(points) {
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

    const k = (n * sumXY - sumX * sumY) / (n * sumXSq - sumX * sumX);
    const b = (sumY - k * sumX) / n;
    for (let i = 0; i < points.length; i++) {
      const x = points[i][0];
      const y = k * x + b;
      results.push([x, Number(y.toFixed(2))]);
    }
    return results;
  }

  // need to find best suited function by interpolation and extend it
  linearExtrapolation(points, period = 14) {
    const result = [];
    const leastSquaresSet = this.#leastSquares(points, period);
    const [set1, set2] = leastSquaresSet.slice(-2);
    result.push(...leastSquaresSet);
    const lastX = points[points.length - 1][0];
    const k = (set2[1] - set1[1]) / (set2[0] - set1[0]);
    for (let i = 0; i < period; i++) {
      const x = lastX + MS_IN_DAY * (i + 1);
      const y = set1[1] + (x - set1[0]) * k;
      result.push([x, Number(y.toFixed(2))]);
    }
    return result;
  }

  // polynomial extrapolation
  // https://en.wikipedia.org/wiki/Neville's_algorithm
  #getLagrangeInterpolationFunction(points) {
    const n = points.length - 1;

    function interpolate(xi) {
      let result = 0; // Initialize result

      for (let i = 0; i < n; i++) {
        // Compute individual terms of above formula
        let term = points[i][1];
        for (let j = 0; j < n; j++) {
          if (j != i)
            term = (term * (xi - points[j][0])) / (points[i][0] - points[j][0]);
        }

        // Add current term to result
        result += term;
      }

      return result;
    }

    return function (x) {
      return interpolate(x);
    };
  }

  #dividedDifferencePolynomial(points) {
    let [x0, y0] = points[0];
    let res = y0;
    let xs = points.map((xy) => xy[0]);
    const dividedDiffTable = Array.from({ length: points.length }, (e) =>
      Array(points.length).fill(0)
    );
    for (let i = 0; i < points.length; i++) {
      dividedDiffTable[i][0] = points[i][1];
    }
    for (let i = 1; i < points.length; i++) {
      for (var j = 0; j < points.length - i; j++) {
        dividedDiffTable[j][i] =
          (dividedDiffTable[j][i - 1] - dividedDiffTable[j + 1][i - 1]) /
          (xs[j] - xs[i + j]);
      }
    }

    return (x) => {
      let mult = 1;

      for (let i = 1; i < points.length; i++) {
        mult *= x - xs[i - 1];
        const diff = mult * dividedDiffTable[0][i];
        res += diff;
      }
      return res;
    };
  }

  #calcInterpolationPerDay(callback, points, period, date = null) {
    const startI = points[0][0];
    const set = points.map(([x, y]) => [
      Math.floor((x - startI) / MS_IN_DAY),
      y,
    ]);

    const func = callback(set);

    const result = [];
    const firstX = date ? date.startTimestamp : points[0][0];
    let x = firstX;
    const endX = date
      ? date.endTimestamp
      : points[points.length - 1][0] + period * MS_IN_DAY;
    let curr = 0;
    do {
      const y = func(curr);

      result.push([x, Number(y.toFixed(2))]);
      x += MS_IN_DAY;
      curr++;
    } while (x <= endX);
    return result;
  }

  // for polynomial extrapolation (some strange results)
  lagrangeInterpolation(points, period, date = null) {
    return this.#calcInterpolationPerDay(
      this.#getLagrangeInterpolationFunction,
      points,
      period,
      date
    );
  }

  newtonsDividedDifferences(points, period, date = null) {
    return this.#calcInterpolationPerDay(
      this.#dividedDifferencePolynomial,
      points,
      period,
      date
    );
  }
}

module.exports = new Predictions();
