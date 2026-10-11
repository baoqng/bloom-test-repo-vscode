// bloom-deps:

export function formatProblemSummary(errors: unknown, warnings: unknown): string {
  if (typeof errors !== 'number' || typeof warnings !== 'number') {
    throw new TypeError('Both errors and warnings must be numbers');
  }

  if (!isFinite(errors) || !isFinite(warnings)) {
    throw new RangeError('Both errors and warnings must be finite numbers');
  }

  if (!Number.isInteger(errors) || !Number.isInteger(warnings)) {
    throw new RangeError('Both errors and warnings must be integers');
  }

  if (errors < 0 || warnings < 0) {
    throw new RangeError('Both errors and warnings must be non-negative');
  }

  if (errors === 0 && warnings === 0) {
    return 'No problems';
  }

  const parts: string[] = [];

  if (errors > 0) {
    parts.push(errors === 1 ? '1 error' : `${errors} errors`);
  }

  if (warnings > 0) {
    parts.push(warnings === 1 ? '1 warning' : `${warnings} warnings`);
  }

  return parts.join(', ');
}