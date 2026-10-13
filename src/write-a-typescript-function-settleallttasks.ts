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

  function wrapValue(value: unknown): { ok: false; error: Error } {
    if (value instanceof Error) {
      return { ok: false, error: value };
    }
    const message = `non-error value: ${String(value)}`;
    const err = new Error(message, { cause: value });
    return { ok: false, error: err };
  }

  const promises: Promise<{ ok: true; value: T } | { ok: false; error: Error }>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    let p: Promise<T>;
    try {
      p = tasks[i]();
    } catch (syncError) {
      promises.push(Promise.resolve(wrapValue(syncError)));
      continue;
    }
    promises.push(
      (async () => {
        try {
          const value = await p;
          return { ok: true as const, value };
        } catch (err) {
          return wrapValue(err);
        }
      })()
    );
  }

  return Promise.all(promises);
}

export { settleAll };