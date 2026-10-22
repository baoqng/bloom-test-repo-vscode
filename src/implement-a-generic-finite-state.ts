// bloom-deps:

type Guard<S, E> = (state: S, event: E) => boolean;
type Action<S, E> = (state: S, event: E) => void;

interface Transition<S, E> {
  from:    S;
  event:   E;
  to:      S;
  guard?:  Guard<S, E>;
  action?: Action<S, E>;
}

class StateMachine<S extends string, E extends string> {
  private _initial: S;
  private _current: S;
  private _history: S[];
  private _transitions: Transition<S, E>[];

  constructor(initial: S, transitions: Transition<S, E>[]) {
    this._initial = initial;
    this._current = initial;
    this._history = [initial];
    this._transitions = transitions;
  }

  dispatch(event: E): boolean {
    const match = this._transitions.find(
      (t) =>
        t.from === this._current &&
        t.event === event &&
        (t.guard === undefined || t.guard(this._current, event))
    );

    if (match === undefined) {
      return false;
    }

    if (match.action !== undefined) {
      match.action(this._current, event);
    }

    this._current = match.to;
    this._history.push(this._current);

    return true;
  }

  getState(): S {
    return this._current;
  }

  getHistory(): S[] {
    return [...this._history];
  }

  reset(): void {
    this._current = this._initial;
    this._history = [this._initial];
  }
}

export { StateMachine, Transition, Guard, Action };