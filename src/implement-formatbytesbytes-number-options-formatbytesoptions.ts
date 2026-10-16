interface FormatBytesOptions {
  standard?: 'SI' | 'IEC';
  decimals?: number;
  space?: boolean;
  locale?: string;
}

export function formatBytes(bytes: number, options?: FormatBytesOptions): string {
  // Validate bytes is a finite number
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) {
    throw new TypeError('bytes must be a finite number');
  }

  // Extract options with defaults
  const standard = options?.standard ?? 'SI';
  const decimals = options?.decimals ?? 2;
  const space = options?.space ?? true;
  const locale = options?.locale ?? 'en-US';

  // Validate decimals is in range [0, 10]
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 10) {
    throw new RangeError('decimals must be an integer in the range [0, 10]');
  }

  // Handle zero case
  if (bytes === 0) {
    return space ? '0 B' : '0B';
  }

  // Handle negative bytes
  const isNegative = bytes < 0;
  const absoluteBytes = Math.abs(bytes);

  // Define units and base
  const base = standard === 'IEC' ? 1024 : 1000;
  const units =
    standard === 'IEC'
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB']
      : ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];

  // Find appropriate unit (largest unit where value >= 1)
  let unitIndex = 0;
  let value = absoluteBytes;

  while (value >= base && unitIndex < units.length - 1) {
    value /= base;
    unitIndex++;
  }

  // Round to specified decimal places using half-away-from-zero
  const rounded = roundHalfAwayFromZero(value, decimals);

  // Determine decimals to use: use 0 if rounded value is a whole number, otherwise use specified decimals
  let displayDecimals = decimals;
  if (Number.isInteger(rounded)) {
    displayDecimals = 0;
  }

  // Format number with locale-specific digit grouping
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
    useGrouping: true,
  });
  const formattedNumber = formatter.format(rounded);

  // Construct result
  const unit = units[unitIndex];
  const sign = isNegative ? '-' : '';
  const spacer = space ? ' ' : '';

  return `${sign}${formattedNumber}${spacer}${unit}`;
}

/**
 * Round a number to a specified number of decimal places using half-away-from-zero semantics.
 * Half-away-from-zero: 0.5 rounds to 1, -0.5 rounds to -1, 1.5 rounds to 2, etc.
 */
function roundHalfAwayFromZero(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;
  
  // Extract the fractional part
  const floor = Math.floor(scaled);
  const fract = scaled - floor;
  
  // Apply half-away-from-zero rounding
  if (fract === 0.5) {
    // Exact tie: round away from zero
    return (scaled >= 0 ? Math.ceil(scaled) : Math.floor(scaled)) / factor;
  } else {
    // Standard rounding (nearest)
    return Math.round(scaled) / factor;
  }
}