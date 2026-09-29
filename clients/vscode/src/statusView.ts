// bloom-deps:

export function classifyRepairOutcome(
  repairIteration: number,
  failureReason: string | null,
  prUrl: string | null,
  cerberusPassClean: boolean | null
): { category: 'clean' | 'repaired' | 'exhausted' | 'infrastructure' | 'failed'; displayText: string; canResubmit: boolean } {
  if (typeof repairIteration !== 'number' || !Number.isFinite(repairIteration) || !Number.isInteger(repairIteration)) {
    throw new TypeError('repairIteration must be a finite integer');
  }
  if (repairIteration < 0) {
    throw new RangeError('repairIteration must be non-negative');
  }

  // Rule 1: infrastructure failure reasons
  if (failureReason === 'INFRASTRUCTURE_CHANGE' || failureReason === 'github_error') {
    return {
      category: 'infrastructure',
      displayText: 'Infrastructure change required',
      canResubmit: false,
    };
  }

  // Rule 2: repair verification failed
  if (failureReason === 'repair_verification_failed') {
    return {
      category: 'exhausted',
      displayText: `Repair budget exhausted after ${repairIteration} iterations`,
      canResubmit: true,
    };
  }

  // Rule 3: clean first pass
  if (typeof prUrl === 'string' && prUrl.length > 0 && repairIteration === 0 && cerberusPassClean === true) {
    return {
      category: 'clean',
      displayText: 'First-pass clean',
      canResubmit: false,
    };
  }

  // Rule 4: repaired after iterations
  if (typeof prUrl === 'string' && prUrl.length > 0 && repairIteration > 0) {
    const iterationLabel = repairIteration === 1 ? 'iteration' : 'iterations';
    return {
      category: 'repaired',
      displayText: `Repaired in ${repairIteration} ${iterationLabel}`,
      canResubmit: false,
    };
  }

  // Rule 5: fallback failed
  return {
    category: 'failed',
    displayText: 'Generation failed',
    canResubmit: true,
  };
}