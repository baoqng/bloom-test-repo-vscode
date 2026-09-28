// bloom-deps:

export function clampTestCounts(passed: number, generated: number): { passed: number; generated: number } {
  if (typeof passed !== 'number' || !isFinite(passed)) {
    throw new TypeError(`'passed' must be a finite number, got: ${passed}`);
  }
  if (typeof generated !== 'number' || !isFinite(generated)) {
    throw new TypeError(`'generated' must be a finite number, got: ${generated}`);
  }

  const roundedPassed = Math.round(passed);
  const roundedGenerated = Math.round(generated);

  if (roundedPassed < -1000 || roundedPassed > 10000) {
    throw new RangeError(`'passed' after rounding (${roundedPassed}) is out of sanity bounds [-1000, 10000]`);
  }
  if (roundedGenerated < -1000 || roundedGenerated > 10000) {
    throw new RangeError(`'generated' after rounding (${roundedGenerated}) is out of sanity bounds [-1000, 10000]`);
  }

  const clampedGenerated = Math.max(0, roundedGenerated);
  const clampedPassed = Math.min(Math.max(0, roundedPassed), clampedGenerated);

  return { passed: clampedPassed, generated: clampedGenerated };
}