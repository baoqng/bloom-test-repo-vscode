// bloom-deps:

export type Subscriber<T> = {
  next(value: T): void;
  error(err: unknown): void;
  complete(): void;
};

export type TeardownLogic = (() => void) | void;
export type SubscribeFn<T> = (subscriber: Subscriber<T>) => TeardownLogic;

type OperatorFn<T, U> = (source: Observable<T>) => Observable<U>;

export class Observable<T> {
  private _subscribe: SubscribeFn<T>;

  constructor(subscribe: SubscribeFn<T>) {
    this._subscribe = subscribe;
  }

  subscribe(observer: Partial<Subscriber<T>>): { unsubscribe(): void } {
    let closed = false;
    let teardown: (() => void) | void;

    const safeSubscriber: Subscriber<T> = {
      next(value: T): void {
        if (closed) return;
        try {
          observer.next?.(value);
        } catch (e) {
          // swallow errors from observer
        }
      },
      error(err: unknown): void {
        if (closed) return;
        closed = true;
        try {
          observer.error?.(err);
        } catch (e) {
          // swallow errors from observer
        } finally {
          if (typeof teardown === 'function') teardown();
        }
      },
      complete(): void {
        if (closed) return;
        closed = true;
        try {
          observer.complete?.();
        } catch (e) {
          // swallow errors from observer
        } finally {
          if (typeof teardown === 'function') teardown();
        }
      },
    };

    try {
      teardown = this._subscribe(safeSubscriber);
    } catch (e) {
      safeSubscriber.error(e);
    }

    return {
      unsubscribe(): void {
        if (closed) return;
        closed = true;
        if (typeof teardown === 'function') teardown();
      },
    };
  }

  pipe<U>(...operators: OperatorFn<any, any>[]): Observable<U> {
    return operators.reduce(
      (source: Observable<any>, operator) => operator(source),
      this as Observable<any>
    ) as Observable<U>;
  }

  static of<T>(...values: T[]): Observable<T> {
    return new Observable<T>((subscriber) => {
      for (const value of values) {
        subscriber.next(value);
        // Check if subscriber is closed (error/complete may have been called)
      }
      subscriber.complete();
    });
  }

  static from<T>(iterable: Iterable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      for (const value of iterable) {
        subscriber.next(value);
      }
      subscriber.complete();
    });
  }

  static merge<T>(...sources: Observable<T>[]): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (sources.length === 0) {
        subscriber.complete();
        return;
      }

      let completedCount = 0;
      let errored = false;
      const subscriptions: Array<{ unsubscribe(): void }> = [];

      for (const source of sources) {
        const sub = source.subscribe({
          next(value: T): void {
            subscriber.next(value);
          },
          error(err: unknown): void {
            if (errored) return;
            errored = true;
            subscriber.error(err);
            // Unsubscribe from all other sources
            for (const s of subscriptions) {
              try { s.unsubscribe(); } catch (_) { /* ignore */ }
            }
          },
          complete(): void {
            completedCount++;
            if (completedCount === sources.length) {
              subscriber.complete();
            }
          },
        });
        subscriptions.push(sub);
      }

      return () => {
        for (const s of subscriptions) {
          try { s.unsubscribe(); } catch (_) { /* ignore */ }
        }
      };
    });
  }

  static empty<T>(): Observable<T> {
    return new Observable<T>((subscriber) => {
      subscriber.complete();
    });
  }

  static never<T>(): Observable<T> {
    return new Observable<T>(() => {
      // never emits
    });
  }

  static map<T, U>(project: (value: T, index: number) => U): OperatorFn<T, U> {
    return (source: Observable<T>): Observable<U> => {
      return new Observable<U>((subscriber) => {
        let index = 0;
        const sub = source.subscribe({
          next(value: T): void {
            subscriber.next(project(value, index++));
          },
          error(err: unknown): void {
            subscriber.error(err);
          },
          complete(): void {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
    };
  }

  static filter<T>(predicate: (value: T, index: number) => boolean): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> => {
      return new Observable<T>((subscriber) => {
        let index = 0;
        const sub = source.subscribe({
          next(value: T): void {
            if (predicate(value, index++)) {
              subscriber.next(value);
            }
          },
          error(err: unknown): void {
            subscriber.error(err);
          },
          complete(): void {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
    };
  }

  static take<T>(count: number): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> => {
      return new Observable<T>((subscriber) => {
        if (count <= 0) {
          subscriber.complete();
          return;
        }

        let emitted = 0;
        const sub = source.subscribe({
          next(value: T): void {
            emitted++;
            subscriber.next(value);
            if (emitted >= count) {
              subscriber.complete();
              sub.unsubscribe();
            }
          },
          error(err: unknown): void {
            subscriber.error(err);
          },
          complete(): void {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
    };
  }

  static skip<T>(count: number): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> => {
      return new Observable<T>((subscriber) => {
        let skipped = 0;
        const sub = source.subscribe({
          next(value: T): void {
            if (skipped < count) {
              skipped++;
              return;
            }
            subscriber.next(value);
          },
          error(err: unknown): void {
            subscriber.error(err);
          },
          complete(): void {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
    };
  }

  static catchError<T, U>(
    handler: (err: unknown) => Observable<U>
  ): OperatorFn<T, T | U> {
    return (source: Observable<T>): Observable<T | U> => {
      return new Observable<T | U>((subscriber) => {
        let innerSub: { unsubscribe(): void } | null = null;

        const outerSub = source.subscribe({
          next(value: T): void {
            subscriber.next(value);
          },
          error(err: unknown): void {
            try {
              const fallback = handler(err);
              innerSub = fallback.subscribe({
                next(value: U): void {
                  subscriber.next(value);
                },
                error(innerErr: unknown): void {
                  subscriber.error(innerErr);
                },
                complete(): void {
                  subscriber.complete();
                },
              });
            } catch (handlerErr) {
              subscriber.error(handlerErr);
            }
          },
          complete(): void {
            subscriber.complete();
          },
        });

        return () => {
          outerSub.unsubscribe();
          innerSub?.unsubscribe();
        };
      });
    };
  }

  static tap<T>(fn: (value: T) => void): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> => {
      return new Observable<T>((subscriber) => {
        const sub = source.subscribe({
          next(value: T): void {
            fn(value);
            subscriber.next(value);
          },
          error(err: unknown): void {
            subscriber.error(err);
          },
          complete(): void {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
    };
  }
}