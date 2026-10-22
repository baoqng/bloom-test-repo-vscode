// bloom-deps:

export function formatDuration(ms: unknown): string {
  if (typeof ms !== 'number' || !isFinite(ms)) {
    throw new TypeError('ms must be a finite number');
  }
  if (ms < 0) {
    throw new RangeError('ms must be non-negative');
  }

  if (ms < 1000) {
    return `${Math.floor(ms)}ms`;
  }

  if (ms < 60000) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  }

  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor(ms / 1000) % 60;
    if (seconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }

  // >= 3600000
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor(ms / 60000) % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}