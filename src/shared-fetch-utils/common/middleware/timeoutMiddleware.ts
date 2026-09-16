// bloom-deps:

import { FetchMiddleware } from '../fetchTypes';

export class RequestTimeoutError extends Error {
  readonly retryAfterMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    this.name = 'RequestTimeoutError';
    this.retryAfterMs = timeoutMs;
  }
}

export function timeoutMiddleware(timeoutMs: number): FetchMiddleware {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError(
      `timeoutMs must be a finite positive number, got ${timeoutMs}`
    );
  }

  return (next) => async (request) => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timerId = setTimeout(() => {
        reject(new RequestTimeoutError(timeoutMs));
      }, timeoutMs);
    });

    try {
      const response = await Promise.race([next(request), timeoutPromise]);
      clearTimeout(timerId);
      return response;
    } catch (err) {
      clearTimeout(timerId);
      throw err;
    }
  };
}