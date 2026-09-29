// bloom-deps:

export type SubmitError =
  | { kind: 'token_expired' }
  | { kind: 'duplicate'; existingJobId: string }
  | { kind: 'needs_classification'; options: Array<{ taskType: string; confidence: number }> }
  | { kind: 'solvability_rejected'; issue: string; suggestion: string | null }
  | { kind: 'rate_limited'; retryAfterMs: number }
  | { kind: 'server_error'; message: string }
  | { kind: 'unknown'; status: number };

export function parseSubmitError(status: number, body: unknown): SubmitError {
  if (typeof status !== 'number' || !Number.isFinite(status)) {
    throw new TypeError('status must be a finite number');
  }

  if (!Number.isInteger(status)) {
    throw new TypeError('status must be a finite integer');
  }

  if (status < 100 || status > 599) {
    throw new RangeError('status must be between 100 and 599 inclusive');
  }

  if (status === 401) {
    return { kind: 'token_expired' };
  }

  if (status === 409) {
    try {
      const b = body as Record<string, unknown>;
      if (b && typeof b === 'object') {
        if (b['error'] === 'duplicate_job') {
          const existingJobId = typeof b['existing_job_id'] === 'string' ? b['existing_job_id'] : '';
          return { kind: 'duplicate', existingJobId };
        }
        if (b['error'] === 'classification_confirmation_required') {
          let options: Array<{ taskType: string; confidence: number }> = [];
          if (Array.isArray(b['options'])) {
            options = (b['options'] as Array<unknown>).map((o) => {
              const opt = o as Record<string, unknown>;
              return {
                taskType: typeof opt['task_type'] === 'string' ? opt['task_type'] : '',
                confidence: typeof opt['confidence'] === 'number' ? opt['confidence'] : 0,
              };
            });
          }
          return { kind: 'needs_classification', options };
        }
      }
    } catch {
      // fall through to unknown
    }
    return { kind: 'unknown', status };
  }

  if (status === 422) {
    try {
      const b = body as Record<string, unknown>;
      const issue =
        b && typeof b === 'object' && typeof b['issue'] === 'string'
          ? b['issue']
          : 'Requirement not solvable';
      const suggestion =
        b && typeof b === 'object' && typeof b['suggestion'] === 'string'
          ? b['suggestion']
          : null;
      return { kind: 'solvability_rejected', issue, suggestion };
    } catch {
      return { kind: 'solvability_rejected', issue: 'Requirement not solvable', suggestion: null };
    }
  }

  if (status === 429) {
    try {
      const b = body as Record<string, unknown>;
      const retryAfterMs =
        b && typeof b === 'object' && typeof b['retry_after_ms'] === 'number'
          ? b['retry_after_ms']
          : 60000;
      return { kind: 'rate_limited', retryAfterMs };
    } catch {
      return { kind: 'rate_limited', retryAfterMs: 60000 };
    }
  }

  if (status >= 500) {
    try {
      const b = body as Record<string, unknown>;
      const message =
        b && typeof b === 'object' && typeof b['message'] === 'string'
          ? b['message']
          : 'Internal server error';
      return { kind: 'server_error', message };
    } catch {
      return { kind: 'server_error', message: 'Internal server error' };
    }
  }

  return { kind: 'unknown', status };
}