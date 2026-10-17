export type PipelineFn = (value: unknown) => unknown | Promise<unknown>;

export interface PipelineOptions {
  onError?: (err: unknown, stepIndex: number, input: unknown) => unknown | Promise<unknown>;
  timeout?: number;
}

export class TimeoutError extends Error {
  stepIndex: number;

  constructor(stepIndex: any, timeoutMs: any) {
    if (typeof stepIndex === 'string' && typeof timeoutMs === 'number') {
      // Called as TimeoutError(message, stepIndex)
      super(`Step ${timeoutMs} timed out`);
      this.stepIndex = timeoutMs;
    } else {
      super(`Step ${stepIndex} timed out after ${timeoutMs}ms`);
      this.stepIndex = stepIndex;
    }
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
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
  return new Promise<unknown>((resolve, reject) => {
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
    return new Promise<unknown>((resolve, reject) => {
      (async () => {
        let current: unknown = input;
        for (let i = 0; i < fns.length; i++) {
          try {
            current = await Promise.resolve(fns[i](current));
          } catch (err) {
            throw err;
          }
        }
        return current;
      })().then(resolve, reject);
    });
  };
}

export function pipelineWith<T>(
  options: PipelineOptions,
  ...fns: PipelineFn[]
): (input: T) => Promise<unknown> {
  validateFns(fns);

  const { onError, timeout } = options;

  return function (input: T): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      (async () => {
        let current: unknown = input;

        for (let i = 0; i < fns.length; i++) {
          const stepInput = current;
          try {
            if (timeout !== undefined) {
              current = await runStepWithTimeout(fns[i], stepInput, i, timeout);
            } else {
              current = await Promise.resolve(fns[i](stepInput));
            }
          } catch (err) {
            if (onError) {
              try {
                current = await Promise.resolve(onError(err, i, stepInput));
              } catch (handlerErr) {
                throw handlerErr;
              }
            } else {
              throw err;
            }
          }
        }

        return current;
      })().then(resolve, reject);
    });
  };
}