export const linearRegression = (data: [number, number][]) => {
  let N = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < data.length; i++) {
    let x = data[i][0];
    let y = data[i][1];
    N++;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = N * sumXX - sumX * sumX;
  if (denominator === 0) {
    // Tüm x değerleri aynıysa tanımsız eğim
    return { slope: 0, intercept: sumY / N };
  }

  const slope = (N * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / N;

  return { slope, intercept };
};

export const linearRegressionLine = (regression: { slope: number; intercept: number }) => {
  return (x: number) => regression.slope * x + regression.intercept;
};

export const mean = (data: number[]) => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
};

export const standardDeviation = (data: number[]) => {
  if (data.length < 2) return 0;
  const avg = mean(data);
  const squareDiffs = data.map(value => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};
