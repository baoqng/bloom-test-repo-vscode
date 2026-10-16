// bloom-deps:

type Listener<Args extends unknown[]> = (...args: Args) => void;

interface ListenerEntry<Args extends unknown[]> {
  listener: Listener<Args>;
  once: boolean;
}

export class TypedEventEmitter<EventMap extends Record<string, unknown[]>> {
  private _listeners: Map<keyof EventMap, Array<ListenerEntry<any>>> = new Map();

  on<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ listener, once: false });
    return () => {
      this.off(event, listener);
    };
  }

  once<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ listener, once: true });
    return () => {
      this.off(event, listener);
    };
  }

  off<K extends keyof EventMap>(event: K, listener: (...args: EventMap[K]) => void): boolean {
    const entries = this._listeners.get(event);
    if (!entries) {
      return false;
    }
    const index = entries.findIndex(entry => entry.listener === listener);
    if (index === -1) {
      return false;
    }
    entries.splice(index, 1);
    return true;
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): number {
    const entries = this._listeners.get(event);
    if (!entries || entries.length === 0) {
      return 0;
    }

    // Snapshot the current entries to avoid calling listeners added during emission
    const snapshot = entries.slice();
    let count = 0;

    for (const entry of snapshot) {
      // Check if this entry is still in the live list (not removed before we got to it)
      const liveEntries = this._listeners.get(event);
      if (!liveEntries) {
        continue;
      }
      const liveIndex = liveEntries.indexOf(entry);
      if (liveIndex === -1) {
        // Was removed before firing
        continue;
      }

      if (entry.once) {
        // Remove from live list before calling
        liveEntries.splice(liveIndex, 1);
      }

      entry.listener(...args);
      count++;
    }

    return count;
  }

  listenerCount<K extends keyof EventMap>(event: K): number {
    const entries = this._listeners.get(event);
    return entries ? entries.length : 0;
  }

  removeAllListeners<K extends keyof EventMap>(event?: K): void {
    if (event === undefined) {
      this._listeners.clear();
    } else {
      this._listeners.delete(event);
    }
  }
}