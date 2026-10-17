export interface FormatBytesOptions {
  standard?: 'SI' | 'IEC';
  decimals?: number;
  space?: boolean;
  locale?: string;
}

function roundHalfAwayFromZero(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(value) * factor) / factor;
}

export function formatBytes(bytes: number, options?: FormatBytesOptions): string {
  if (typeof bytes !== 'number' || !isFinite(bytes)) {
    throw new TypeError(`bytes must be a finite number, got ${bytes}`);
  }

  const standard = options?.standard ?? 'SI';
  const decimals = options?.decimals ?? 2;
  const space = options?.space ?? true;
  const locale = options?.locale ?? 'en-US';

  if (decimals < 0 || decimals > 10 || !Number.isInteger(decimals)) {
    throw new RangeError(`decimals must be an integer in [0, 10], got ${decimals}`);
  }

  const separator = space ? ' ' : '';

  const negative = bytes < 0;
  const absBytes = Math.abs(bytes);

  if (absBytes === 0) {
    return `0${separator}B`;
  }

  const siUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const iecUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

  const units = standard === 'IEC' ? iecUnits : siUnits;
  const base = standard === 'IEC' ? 1024 : 1000;

  let unitIndex = 0;
  let value = absBytes;

  for (let i = units.length - 1; i >= 1; i--) {
    const threshold = Math.pow(base, i);
    if (absBytes >= threshold) {
      unitIndex = i;
      value = absBytes / threshold;
      break;
    }
  }

  const rounded = roundHalfAwayFromZero(value, decimals);

  // Use minimumFractionDigits: 0 so trailing zeros are stripped,
  // but maximumFractionDigits: decimals to limit precision.
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(rounded);

  const sign = negative ? '-' : '';
  return `${sign}${formatted}${separator}${units[unitIndex]}`;
}