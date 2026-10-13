// bloom-deps:

export function formatRelative(thenMs: unknown, nowMs: unknown): string {
  if (typeof thenMs !== 'number' || !Number.isFinite(thenMs)) {
    throw new TypeError('thenMs must be a finite number');
  }
  if (typeof nowMs !== 'number' || !Number.isFinite(nowMs)) {
    throw new TypeError('nowMs must be a finite number');
  }

  const diff = (nowMs as number) - (thenMs as number);
  const s = Math.abs(diff) / 1000;

  if (s < 45) {
    return 'just now';
  }

  let unit: string;
  let unitSeconds: number;

  if (s < 2700) {
    unit = 'minute';
    unitSeconds = 60;
  } else if (s < 79200) {
    unit = 'hour';
    unitSeconds = 3600;
  } else if (s < 2246400) {
    unit = 'day';
    unitSeconds = 86400;
  } else if (s < 27648000) {
    unit = 'month';
    unitSeconds = 2592000;
  } else {
    unit = 'year';
    unitSeconds = 31536000;
  }

  const n = Math.max(1, Math.round(s / unitSeconds));
  const plural = n === 1 ? '' : 's';

  if (diff >= 0) {
    return `${n} ${unit}${plural} ago`;
  } else {
    return `in ${n} ${unit}${plural}`;
  }
}