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

    const subscriber: Subscriber<T> = {
      next(value: T): void {
        if (closed) return;
        try {
          observer.next?.(value);
        } catch {
          // swallow errors from observer
        }
      },
      error(err: unknown): void {
        if (closed) return;
        closed = true;
        try {
          observer.error?.(err);
        } catch {
          // swallow
        }
        if (typeof teardown === 'function') {
          teardown();
        }
      },
      complete(): void {
        if (closed) return;
        closed = true;
        try {
          observer.complete?.();
        } catch {
          // swallow
        }
        if (typeof teardown === 'function') {
          teardown();
        }
      },
    };

    try {
      teardown = this._subscribe(subscriber);
    } catch (err) {
      subscriber.error(err);
    }

    return {
      unsubscribe(): void {
        if (closed) return;
        closed = true;
        if (typeof teardown === 'function') {
          teardown();
        }
      },
    };
  }

  pipe<U>(...operators: OperatorFn<any, any>[]): Observable<U> {
    return operators.reduce(
      (obs: Observable<any>, op: OperatorFn<any, any>) => op(obs),
      this as Observable<any>
    ) as Observable<U>;
  }

  static map<T, U>(project: (value: T, index: number) => U): OperatorFn<T, U> {
    return (source: Observable<T>): Observable<U> =>
      new Observable<U>((subscriber) => {
        let index = 0;
        const sub = source.subscribe({
          next(value: T) {
            subscriber.next(project(value, index++));
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
  }

  static filter<T>(predicate: (value: T, index: number) => boolean): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> =>
      new Observable<T>((subscriber) => {
        let index = 0;
        const sub = source.subscribe({
          next(value: T) {
            if (predicate(value, index++)) {
              subscriber.next(value);
            }
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
  }

  static take<T>(count: number): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> =>
      new Observable<T>((subscriber) => {
        if (count <= 0) {
          subscriber.complete();
          return;
        }
        let seen = 0;
        const sub = source.subscribe({
          next(value: T) {
            seen++;
            subscriber.next(value);
            if (seen >= count) {
              subscriber.complete();
              sub.unsubscribe();
            }
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
  }

  static skip<T>(count: number): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> =>
      new Observable<T>((subscriber) => {
        let skipped = 0;
        const sub = source.subscribe({
          next(value: T) {
            if (skipped < count) {
              skipped++;
              return;
            }
            subscriber.next(value);
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
  }

  static catchError<T, U>(
    handler: (err: unknown) => Observable<U>
  ): OperatorFn<T, T | U> {
    return (source: Observable<T>): Observable<T | U> =>
      new Observable<T | U>((subscriber) => {
        let innerSub: { unsubscribe(): void } | null = null;
        const outerSub = source.subscribe({
          next(value: T) {
            subscriber.next(value);
          },
          error(err: unknown) {
            try {
              const fallback = handler(err);
              innerSub = fallback.subscribe({
                next(value: U) {
                  subscriber.next(value);
                },
                error(innerErr: unknown) {
                  subscriber.error(innerErr);
                },
                complete() {
                  subscriber.complete();
                },
              });
            } catch (handlerErr) {
              subscriber.error(handlerErr);
            }
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => {
          outerSub.unsubscribe();
          innerSub?.unsubscribe();
        };
      });
  }

  static tap<T>(fn: (value: T) => void): OperatorFn<T, T> {
    return (source: Observable<T>): Observable<T> =>
      new Observable<T>((subscriber) => {
        const sub = source.subscribe({
          next(value: T) {
            fn(value);
            subscriber.next(value);
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
        return () => sub.unsubscribe();
      });
  }

  static of<T>(...values: T[]): Observable<T> {
    return new Observable<T>((subscriber) => {
      for (const value of values) {
        subscriber.next(value);
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
      const subs: { unsubscribe(): void }[] = [];

      for (const source of sources) {
        const sub = source.subscribe({
          next(value: T) {
            subscriber.next(value);
          },
          error(err: unknown) {
            if (errored) return;
            errored = true;
            subscriber.error(err);
            for (const s of subs) {
              s.unsubscribe();
            }
          },
          complete() {
            if (errored) return;
            completedCount++;
            if (completedCount === sources.length) {
              subscriber.complete();
            }
          },
        });
        subs.push(sub);
      }

      return () => {
        for (const s of subs) {
          s.unsubscribe();
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
}