// bloom-deps:

export function classifyJobOutcome(
  status: string,
  failureReason: string | null,
  repairIteration: number,
  cerberusPassClean: boolean | null
): 'clean' | 'repaired' | 'infrastructure' | 'failed' {
  if (typeof status !== 'string') {
    throw new TypeError('status must be a string');
  }

  if (typeof repairIteration !== 'number' || !Number.isFinite(repairIteration) || !Number.isInteger(repairIteration)) {
    throw new TypeError('repairIteration must be a finite integer');
  }

  if (repairIteration < 0) {
    throw new RangeError('repairIteration must not be negative');
  }

  if (
    failureReason === 'INFRASTRUCTURE_CHANGE' ||
    failureReason === 'github_error' ||
    failureReason === 'indexing_not_ready'
  ) {
    return 'infrastructure';
  }

  if (status === 'complete' && repairIteration === 0 && cerberusPassClean === true) {
    return 'clean';
  }

  if (status === 'complete' && repairIteration > 0) {
    return 'repaired';
  }

  return 'failed';
}