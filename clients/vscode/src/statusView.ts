// bloom-deps:

export function buildStatusLineText(
  status: string,
  repairIteration: number,
  testsGenerated: number,
  testsPassed: number
): string {
  if (typeof status !== 'string') {
    throw new TypeError('status must be a string');
  }
  if (typeof repairIteration !== 'number' || !Number.isFinite(repairIteration)) {
    throw new TypeError('repairIteration must be a finite number');
  }
  if (typeof testsGenerated !== 'number' || !Number.isFinite(testsGenerated)) {
    throw new TypeError('testsGenerated must be a finite number');
  }
  if (typeof testsPassed !== 'number' || !Number.isFinite(testsPassed)) {
    throw new TypeError('testsPassed must be a finite number');
  }

  const buildTestSummary = (): string => {
    if (testsGenerated <= 0) {
      return '';
    }
    const clamped = Math.min(Math.max(Math.floor(testsPassed), 0), Math.floor(testsGenerated));
    const total = Math.floor(testsGenerated);
    return ` \u00B7 ${clamped}/${total} tests`;
  };

  switch (status) {
    case 'complete': {
      if (repairIteration === 0) {
        return `First-pass clean${buildTestSummary()}`;
      }
      const iterWord = repairIteration === 1 ? 'iteration' : 'iterations';
      return `Repaired in ${repairIteration} ${iterWord}${buildTestSummary()}`;
    }
    case 'processing':
      return 'Generating\u2026';
    case 'queued':
      return 'Waiting in queue';
    case 'failed':
      return 'Generation failed';
    case 'review_pending': {
      const summary = buildTestSummary();
      return `Ready to review${summary}`;
    }
    default:
      return status.replace(/_/g, ' ');
  }
}