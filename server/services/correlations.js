let { min, pow, sqrt } = Math

class Correlations {
  // provide arrays of the same length, equal indices correspond to the same dates 
  pearsonCoefficient(d1, d2) {
    let add = (a, b) => a + b
    let n = min(d1.length, d2.length)
    if (n === 0) {
      return 0
    }
    [d1, d2] = [d1.slice(0, n), d2.slice(0, n)]
    let [sum1, sum2] = [d1, d2].map(l => l.reduce(add))
    let [pow1, pow2] = [d1, d2].map(l => l.reduce((a, b) => a + pow(b, 2), 0))
    let mulSum = d1.map((n, i) => n * d2[i]).reduce(add)
    let dense = sqrt((pow1 - pow(sum1, 2) / n) * (pow2 - pow(sum2, 2) / n))
    if (dense === 0) {
      return 0
    }
    return (mulSum - (sum1 * sum2 / n)) / dense
  }
}

module.exports = new Correlations();