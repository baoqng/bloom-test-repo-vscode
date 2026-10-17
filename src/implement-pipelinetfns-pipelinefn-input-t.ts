export type PipelineFn = (value: unknown) => unknown | Promise<unknown>;

export interface PipelineOptions {
  onError?: (err: unknown, stepIndex: number, input: unknown) => unknown | Promise<unknown>;
  timeout?: number;
}

export class TimeoutError extends Error {
  stepIndex: number;

  constructor(stepIndex: string | number, timeoutMs: number);
  constructor(stepIndex: any, timeoutMs: any) {
    if (typeof stepIndex === 'number') {
      super(`Step ${stepIndex} timed out after ${timeoutMs}ms`);
      this.stepIndex = stepIndex;
    } else {
      // Called as new TimeoutError(name, stepIndex)
      super(stepIndex);
      this.stepIndex = timeoutMs;
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
  input: unknown,
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
      result = fn(input);
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
          try {
            if (timeout !== undefined && timeout > 0) {
              current = await runStepWithTimeout(fns[i], current, i, timeout);
            } else {
              current = await Promise.resolve(fns[i](current));
            }
          } catch (err) {
            if (onError) {
              current = await Promise.resolve(onError(err, i, current));
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