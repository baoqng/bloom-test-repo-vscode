// bloom-deps:

function enforceTaskBudget(params: { totalOverhead: number; lifetimeMs: number; taskName: string }): void {
  if (params === null || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('params must be a non-null object');
  }

  if (typeof params.taskName !== 'string' || params.taskName.length === 0) {
    throw new TypeError('taskName must be a non-empty string');
  }

  if (typeof params.totalOverhead !== 'number' || !isFinite(params.totalOverhead) || params.totalOverhead < 0) {
    throw new TypeError('totalOverhead must be a non-negative finite number');
  }

  if (typeof params.lifetimeMs !== 'number' || !isFinite(params.lifetimeMs) || params.lifetimeMs <= 0) {
    throw new TypeError('lifetimeMs must be a positive finite number');
  }

  if (params.totalOverhead >= params.lifetimeMs) {
    throw new RangeError(
      `Task '${params.taskName}': totalOverhead (${params.totalOverhead}ms) must be strictly less than lifetimeMs (${params.lifetimeMs}ms)`
    );
  }
}

export { enforceTaskBudget };