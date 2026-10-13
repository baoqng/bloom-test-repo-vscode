// bloom-deps:

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  const message = `non-error value: ${String(value)}`;
  const err = new Error(message, { cause: value });
  return err;
}

function settleAll<T>(
  tasks: Array<() => Promise<T>>
): Promise<Array<{ ok: true; value: T } | { ok: false; error: Error }>> {
  if (!Array.isArray(tasks)) {
    throw new TypeError('tasks must be an array');
  }
  for (let i = 0; i < tasks.length; i++) {
    if (typeof tasks[i] !== 'function') {
      throw new TypeError(`tasks[${i}] is not a function`);
    }
  }

  const promises: Array<Promise<{ ok: true; value: T } | { ok: false; error: Error }>> = [];

  for (let i = 0; i < tasks.length; i++) {
    let p: Promise<T>;
    try {
      p = tasks[i]();
    } catch (syncError) {
      const result: { ok: false; error: Error } = { ok: false, error: toError(syncError) };
      promises.push(Promise.resolve(result));
      continue;
    }

    promises.push(
      p.then(
        (value): { ok: true; value: T } => ({ ok: true, value }),
        (reason): { ok: false; error: Error } => ({ ok: false, error: toError(reason) })
      )
    );
  }

  return Promise.all(promises);
}

export { settleAll };