// bloom-deps:

export interface Transition<S, E, C = unknown> {
  from: S | S[];
  event: E;
  to: S;
  guard?: (ctx: C) => boolean;
  action?: (ctx: C, event: E) => C;
}

export interface StateMachineConfig<S, E, C = unknown> {
  initial: S;
  transitions: Transition<S, E, C>[];
  onEnter?: Partial<Record<string, (ctx: C) => void>>;
  onExit?: Partial<Record<string, (ctx: C) => void>>;
  context?: C;
  historySize?: number;
}

export class StateMachine<S extends string, E extends string, C = unknown> {
  private _current: S;
  private _context: C;
  private _history: S[];
  private readonly _config: StateMachineConfig<S, E, C>;
  private readonly _historySize: number;
  private readonly _initialContext: C;

  constructor(config: StateMachineConfig<S, E, C>) {
    const historySize = config.historySize ?? 10;

    if (historySize < 0) {
      throw new RangeError(`historySize must be >= 0, got ${historySize}`);
    }

    const outgoing = config.transitions.filter((t) => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(config.initial);
    });

    // A terminal state (no outgoing transitions) is allowed.
    // The spec says throw TypeError if initial state has no transitions defined
    // and it isn't a terminal state. Interpretation: if no transitions at all
    // reference the initial state as a source, it may still be a valid terminal.
    // The stated rule: "no outgoing transitions is allowed" — so we never throw
    // for missing outgoing. Re-reading: "Throw TypeError if initial state has no
    // transitions defined and it isn't a terminal state (no outgoing transitions
    // is allowed)". This means: throw only if it is NOT a terminal state, but
    // since having no outgoing transitions IS being a terminal state, we never
    // throw. However the contract says [initial_state_no_transitions] ->
    // "throw_type_error". We must throw if initial has no outgoing transitions
    // AND... the parenthetical clarifies terminal is fine. This is contradictory.
    // Contract wins: throw TypeError when initial state has no outgoing transitions
    // defined among the transitions list — but the stated text says terminal is
    // allowed. We follow: only throw if there are transitions defined in the
    // config but none from the initial state (i.e., it's not a deliberate terminal).
    // Simplest safe reading: throw TypeError if config has transitions but none
    // originate from initial state.
    if (config.transitions.length > 0 && outgoing.length === 0) {
      throw new TypeError(
        `Initial state "${String(config.initial)}" has no outgoing transitions defined.`
      );
    }

    this._config = config;
    this._historySize = historySize;
    this._initialContext = (config.context ?? (undefined as unknown as C));
    this._current = config.initial;
    this._context = this._initialContext;
    this._history = [];
  }

  get current(): S {
    return this._current;
  }

  get context(): C {
    return this._context;
  }

  get history(): S[] {
    return [...this._history];
  }

  send(event: E): boolean {
    const transition = this._findTransition(this._current, event);
    if (transition === null) {
      return false;
    }

    const fromState = this._current;
    const toState = transition.to;

    // onExit fires before action
    const exitHook = this._config.onExit?.[fromState as string];
    if (exitHook) {
      exitHook(this._context);
    }

    // action called with current context; return value becomes new context
    let newContext = this._context;
    if (transition.action) {
      newContext = transition.action(this._context, event);
    }

    // Push current state to history before transitioning
    this._pushHistory(fromState);

    // Enter new state
    this._current = toState;
    this._context = newContext;

    // onEnter fires after entering new state
    const enterHook = this._config.onEnter?.[toState as string];
    if (enterHook) {
      enterHook(this._context);
    }

    return true;
  }

  can(event: E): boolean {
    return this._findTransition(this._current, event) !== null;
  }

  reset(): void {
    this._current = this._config.initial;
    this._context = this._initialContext;
    this._history = [];
  }

  getTransitionsFor(state: S): Transition<S, E, C>[] {
    return this._config.transitions.filter((t) => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(state);
    });
  }

  private _findTransition(state: S, event: E): Transition<S, E, C> | null {
    const candidates = this._config.transitions.filter((t) => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(state) && t.event === event;
    });

    for (const candidate of candidates) {
      if (!candidate.guard) {
        return candidate;
      }
      try {
        if (candidate.guard(this._context)) {
          return candidate;
        }
      } catch {
        // Guard throws: treat as false
      }
    }

    return null;
  }

  private _pushHistory(state: S): void {
    if (this._historySize === 0) {
      return;
    }
    this._history.push(state);
    if (this._history.length > this._historySize) {
      this._history.splice(0, this._history.length - this._historySize);
    }
  }
}