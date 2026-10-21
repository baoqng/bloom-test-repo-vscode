// bloom-deps:

function createEventBus<Events extends Record<string, unknown>>(): {
  on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void;
  once<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void;
} {
  const listeners = new Map<string, Array<(data: unknown) => void>>();

  function getHandlers(event: string): Array<(data: unknown) => void> {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    return listeners.get(event)!;
  }

  function on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void {
    if (typeof event !== 'string') {
      throw new TypeError('Event must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    const handlers = getHandlers(event as string);
    handlers.push(handler as (data: unknown) => void);
    return () => {
      off(event, handler);
    };
  }

  function emit<K extends keyof Events>(event: K, data: Events[K]): void {
    if (typeof event !== 'string') {
      throw new TypeError('Event must be a string');
    }
    const handlers = getHandlers(event as string).slice();
    for (const handler of handlers) {
      handler(data);
    }
  }

  function off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): void {
    if (typeof event !== 'string') {
      throw new TypeError('Event must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    const handlers = getHandlers(event as string);
    const index = handlers.indexOf(handler as (data: unknown) => void);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  function once<K extends keyof Events>(event: K, handler: (data: Events[K]) => void): () => void {
    if (typeof event !== 'string') {
      throw new TypeError('Event must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    let removed = false;
    const wrapper = (data: unknown) => {
      if (!removed) {
        removed = true;
        off(event, wrapper as unknown as (data: Events[K]) => void);
        (handler as (data: unknown) => void)(data);
      }
    };
    const handlers = getHandlers(event as string);
    handlers.push(wrapper);
    return () => {
      if (!removed) {
        removed = true;
        off(event, wrapper as unknown as (data: Events[K]) => void);
      }
    };
  }

  return { on, emit, off, once };
}

export { createEventBus };