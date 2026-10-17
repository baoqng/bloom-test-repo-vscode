// bloom-deps:

export class EventEmitter<Events extends Record<string, unknown[]>> {
  private readonly _listeners: Map<keyof Events, Array<{ listener: (...args: any[]) => void; once: boolean; wrapper?: (...args: any[]) => void }>> = new Map();

  private _validateEvent(event: unknown): asserts event is keyof Events {
    if (typeof event !== 'string' || event === '') {
      throw new TypeError(`Event must be a non-empty string, got: ${String(event)}`);
    }
  }

  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    this._validateEvent(event);
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ listener, once: false });
    return this;
  }

  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    this._validateEvent(event);
    const entries = this._listeners.get(event);
    if (!entries) {
      return this;
    }
    const idx = entries.findIndex(entry => entry.listener === listener);
    if (idx !== -1) {
      entries.splice(idx, 1);
    }
    return this;
  }

  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this {
    this._validateEvent(event);
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ listener, once: true });
    return this;
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    this._validateEvent(event);
    const entries = this._listeners.get(event);
    if (!entries || entries.length === 0) {
      return false;
    }

    // Snapshot current entries to iterate in registration order
    const snapshot = entries.slice();

    for (const entry of snapshot) {
      if (entry.once) {
        // Remove before invocation so re-entrant emits don't retrigger
        const current = this._listeners.get(event);
        if (current) {
          const idx = current.indexOf(entry);
          if (idx !== -1) {
            current.splice(idx, 1);
          }
        }
      }
      entry.listener(...args);
    }

    return true;
  }

  listenerCount<K extends keyof Events>(event: K): number {
    this._validateEvent(event);
    const entries = this._listeners.get(event);
    return entries ? entries.length : 0;
  }
}