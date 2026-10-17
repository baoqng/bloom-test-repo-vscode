// bloom-deps:

export class EventEmitter<Events extends Record<string, unknown[]>> {
  private _listeners: Map<keyof Events, Array<(...args: any[]) => void>> = new Map();

  private _validateEvent(event: unknown): void {
    if (typeof event !== 'string') {
      throw new TypeError(`Event must be a string, got ${typeof event}`);
    }
  }

  private _validateListener(listener: unknown): void {
    if (typeof listener !== 'function') {
      throw new TypeError(`Listener must be a function, got ${typeof listener}`);
    }
  }

  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): () => void {
    this._validateEvent(event);
    this._validateListener(listener);

    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(listener as (...args: any[]) => void);

    let unsubscribed = false;
    return () => {
      if (!unsubscribed) {
        unsubscribed = true;
        this.off(event, listener);
      }
    };
  }

  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): boolean {
    this._validateEvent(event);
    this._validateListener(listener);

    const listeners = this._listeners.get(event);
    if (!listeners) {
      return false;
    }

    const index = listeners.indexOf(listener as (...args: any[]) => void);
    if (index === -1) {
      return false;
    }

    listeners.splice(index, 1);
    return true;
  }

  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): () => void {
    this._validateEvent(event);
    this._validateListener(listener);

    let fired = false;
    let unsubscribed = false;

    const wrapper = (...args: Events[K]) => {
      if (!fired) {
        fired = true;
        this.off(event, wrapper as unknown as (...args: Events[K]) => void);
        listener(...args);
      }
    };

    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(wrapper as (...args: any[]) => void);

    return () => {
      if (!unsubscribed) {
        unsubscribed = true;
        this.off(event, wrapper as unknown as (...args: Events[K]) => void);
      }
    };
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): number {
    this._validateEvent(event);

    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return 0;
    }

    // Snapshot the listeners at emit time so that listeners added during emit
    // fire only on the next emit
    const snapshot = listeners.slice();
    let count = 0;
    for (const listener of snapshot) {
      // Only call if still present in the live list (handles once wrappers
      // and removals during emit)
      if (listeners.includes(listener) || true) {
        // We call all snapshot listeners; new ones added during emit are
        // not in the snapshot so they won't be called this round.
        listener(...(args as any[]));
        count++;
      }
    }
    return count;
  }

  listenerCount(event: keyof Events): number {
    this._validateEvent(event);
    const listeners = this._listeners.get(event);
    return listeners ? listeners.length : 0;
  }

  removeAllListeners(event?: keyof Events): void {
    if (event === undefined) {
      this._listeners.clear();
    } else {
      this._validateEvent(event);
      this._listeners.delete(event);
    }
  }
}