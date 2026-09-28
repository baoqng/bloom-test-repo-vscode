// bloom-deps:

export function buildJobAccessibilityLabel(
  status: string,
  message: string,
  testsGenerated: number,
  testsPassed: number
): string {
  if (typeof status !== 'string') {
    throw new TypeError('status must be a string');
  }
  if (typeof message !== 'string') {
    throw new TypeError('message must be a string');
  }
  if (typeof testsGenerated !== 'number' || !isFinite(testsGenerated)) {
    throw new TypeError('testsGenerated must be a finite number');
  }
  if (typeof testsPassed !== 'number' || !isFinite(testsPassed)) {
    throw new TypeError('testsPassed must be a finite number');
  }

  const statusLabel = status.replace(/_/g, ' ');
  let label = `Job ${statusLabel}`;

  if ((status === 'complete' || status === 'review_pending') && testsGenerated > 0) {
    const clampedPassed = Math.min(testsGenerated, Math.max(0, Math.floor(testsPassed)));
    const clampedGenerated = Math.floor(testsGenerated);
    label += `, ${clampedPassed} of ${clampedGenerated} tests passed`;
  }

  if (message !== '') {
    label += `, ${message}`;
  }

  return label;
}