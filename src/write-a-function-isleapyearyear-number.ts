// bloom-deps:

export function isLeapYear(year: number): boolean {
  if (typeof year !== 'number' || !Number.isFinite(year) || !Number.isInteger(year) || year <= 0) {
    throw new TypeError(
      `year must be a finite integer strictly greater than 0, but received: ${year}`
    );
  }
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  if (year % 4 === 0) return true;
  return false;
}