export function roundBankers(n: number, decimals: number): number {
  if (
    typeof decimals !== 'number' ||
    !Number.isFinite(decimals) ||
    !Number.isInteger(decimals) ||
    decimals < 0
  ) {
    throw new TypeError('decimals must be a non-negative integer');
  }

  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TypeError('n must be a finite number');
  }

  const factor = Math.pow(10, decimals);
  const shifted = n * factor;
  const floor = Math.floor(shifted);
  const fract = shifted - floor;

  let rounded: number;

  if (fract === 0.5) {
    // Banker's rounding: round to even
    if (floor % 2 === 0) {
      rounded = floor;
    } else {
      rounded = floor + 1;
    }
  } else {
    rounded = Math.round(shifted);
  }

  return rounded / factor;
}