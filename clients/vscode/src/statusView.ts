// bloom-deps:

export function isCreditLow(balanceUsd: number, thresholdUsd: number): boolean {
  if (typeof balanceUsd !== 'number' || !Number.isFinite(balanceUsd)) {
    throw new TypeError('balanceUsd must be a finite number');
  }
  if (typeof thresholdUsd !== 'number' || !Number.isFinite(thresholdUsd)) {
    throw new TypeError('thresholdUsd must be a finite number');
  }
  if (thresholdUsd < 0) {
    throw new RangeError('thresholdUsd must not be negative');
  }
  if (balanceUsd < 0) {
    throw new RangeError('balanceUsd must not be negative');
  }
  return balanceUsd < thresholdUsd;
}