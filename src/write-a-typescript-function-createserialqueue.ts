// bloom-deps:

export function createSerialQueue(): {
  push<T>(task: () => Promise<T>): Promise<T>;
  size(): number;
  onIdle(): Promise<void>;
} {
  const pendingTasks: Array<() => Promise<void>> = [];
  let isRunning = false;
  let idleResolvers: Array<() => void> = [];

  function validateTask(task: unknown): asserts task is () => Promise<unknown> {
    if (typeof task !== "function") {
      throw new TypeError("task must be a function");
    }
  }

  async function processQueue(): Promise<void> {
    isRunning = true;
    while (pendingTasks.length > 0) {
      const task = pendingTasks.shift();
      if (task) {
        await task();
      }
    }
    isRunning = false;

    const resolvers = idleResolvers;
    idleResolvers = [];
    for (const resolver of resolvers) {
      resolver();
    }
  }

  function push<T>(task: () => Promise<T>): Promise<T> {
    validateTask(task);

    return new Promise<T>((resolve, reject) => {
      const wrappedTask = async (): Promise<void> => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      pendingTasks.push(wrappedTask);

      if (!isRunning) {
        processQueue();
      }
    });
  }

  function size(): number {
    return pendingTasks.length + (isRunning ? 1 : 0);
  }

  function onIdle(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (size() === 0) {
        Promise.resolve().then(resolve);
      } else {
        idleResolvers.push(resolve);
      }
    });
  }

  return { push, size, onIdle };
}