// bloom-deps:

function computeEMA(values: number[], alpha: number): number[] {
  if (typeof alpha !== 'number' || isNaN(alpha) || alpha <= 0 || alpha > 1) {
    throw new RangeError(`alpha must be in (0, 1]; received ${alpha}`);
  }

  if (values.length === 0) {
    return [];
  }

  const output: number[] = new Array(values.length);
  output[0] = values[0];

  for (let i = 1; i < values.length; i++) {
    output[i] = alpha * values[i] + (1 - alpha) * output[i - 1];
  }

  return output;
}

export { computeEMA };