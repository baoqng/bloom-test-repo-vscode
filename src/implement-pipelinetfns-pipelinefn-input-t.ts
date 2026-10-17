export type PipelineFn = (value: unknown) => unknown | Promise<unknown>;

export interface PipelineOptions {
  onError?: (err: unknown, stepIndex: number, input: unknown) => unknown | Promise<unknown>;
  timeout?: number;
}

export class TimeoutError extends Error {
  stepIndex: number;

  constructor(stepIndex: number | string, timeoutMs?: number) {
    if (typeof stepIndex === 'string') {
      // Called as new TimeoutError(message, stepIndex)
      const message = stepIndex;
      const idx = timeoutMs as number;
      super(message);
      this.name = 'TimeoutError';
      this.stepIndex = idx;
    } else {
      // Called as new TimeoutError(stepIndex, timeoutMs)
      super(`Step ${stepIndex} timed out after ${timeoutMs}ms`);
      this.name = 'TimeoutError';
      this.stepIndex = stepIndex;
    }
  }
}

function validateFns(fns: PipelineFn[]): void {
  for (let i = 0; i < fns.length; i++) {
    if (typeof fns[i] !== 'function') {
      throw new TypeError(`Argument at index ${i} is not a function`);
    }
  }
}

function runStepWithTimeout(
  fn: PipelineFn,
  value: unknown,
  stepIndex: number,
  timeoutMs: number
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new TimeoutError(stepIndex, timeoutMs));
      }
    }, timeoutMs);

    let result: unknown;
    try {
      result = fn(value);
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
      return;
    }

    Promise.resolve(result).then(
      (val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      },
      (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    );
  });
}

export function pipeline<T>(...fns: PipelineFn[]): (input: T) => Promise<unknown> {
  validateFns(fns);

  return function (input: T): Promise<unknown> {
    let promise: Promise<unknown> = Promise.resolve(input as unknown);

    for (let i = 0; i < fns.length; i++) {
      const fn = fns[i];
      promise = promise.then((value) => {
        let result: unknown;
        try {
          result = fn(value);
        } catch (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(result);
      });
    }

    return promise;
  };
}

export function pipelineWith<T>(
  options: PipelineOptions,
  ...fns: PipelineFn[]
): (input: T) => Promise<unknown> {
  validateFns(fns);

  return function (input: T): Promise<unknown> {
    const { onError, timeout } = options;

    async function runStep(stepIndex: number, value: unknown): Promise<unknown> {
      const fn = fns[stepIndex];

      let stepResult: unknown;
      try {
        if (timeout !== undefined && timeout >= 0) {
          stepResult = await runStepWithTimeout(fn, value, stepIndex, timeout);
        } else {
          stepResult = await Promise.resolve(fn(value));
        }
      } catch (err) {
        if (onError) {
          // onError may throw or reject — let that propagate
          const recovered = await Promise.resolve(onError(err, stepIndex, value));
          return recovered;
        }
        throw err;
      }

      return stepResult;
    }

    return (async () => {
      let current: unknown = input as unknown;

      for (let i = 0; i < fns.length; i++) {
        current = await runStep(i, current);
      }

      return current;
    })();
  };
}