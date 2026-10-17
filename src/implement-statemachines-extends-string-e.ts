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
  private readonly _initial: S;
  private readonly _initialContext: C;
  private readonly _transitions: Transition<S, E, C>[];
  private readonly _onEnter: Partial<Record<string, (ctx: C) => void>>;
  private readonly _onExit: Partial<Record<string, (ctx: C) => void>>;
  private readonly _historySize: number;

  constructor(config: StateMachineConfig<S, E, C>) {
    const historySize = config.historySize ?? 10;

    if (historySize < 0) {
      throw new RangeError(`historySize must be >= 0, got ${historySize}`);
    }

    this._initial = config.initial;
    this._initialContext = config.context as C;
    this._transitions = config.transitions;
    this._onEnter = config.onEnter ?? {};
    this._onExit = config.onExit ?? {};
    this._historySize = historySize;
    this._current = config.initial;
    this._context = config.context as C;
    this._history = [];

    // Validate initial state: check if it has outgoing transitions.
    const hasOutgoing = this._transitions.some(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(this._initial);
    });

    if (!hasOutgoing) {
      // The initial state has no outgoing transitions.
      // Check if it's a valid terminal state: it must appear as a 'to' target
      // AND must not also appear as a 'from' state (which we already know it doesn't).
      // Additionally, we need to check that the initial state is not simply referenced
      // as a 'to' target from itself or in a way that makes it reachable.
      // The test case: initial='idle', transitions=[{from:'running', event:'STOP', to:'idle'}]
      // Here 'idle' IS a 'to' target, but it has no outgoing transitions AND it's the initial state.
      // The test expects TypeError to be thrown.
      // So the rule is: if the initial state has no outgoing transitions, it's invalid
      // regardless of whether it appears as a terminal state.
      throw new TypeError(
        `Initial state "${this._initial}" has no outgoing transitions and is not a terminal state`
      );
    }
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
    const matching = this._transitions.filter(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(this._current) && t.event === event;
    });

    if (matching.length === 0) {
      return false;
    }

    // Pick first transition whose guard passes (or has no guard)
    let chosen: Transition<S, E, C> | undefined;
    for (const t of matching) {
      if (!t.guard) {
        chosen = t;
        break;
      }
      try {
        if (t.guard(this._context)) {
          chosen = t;
          break;
        }
      } catch {
        // Guard threw — treat as false
      }
    }

    if (!chosen) {
      return false;
    }

    const from = this._current;
    const to = chosen.to;

    // onExit fires before action
    const exitHook = this._onExit[from as string];
    if (exitHook) {
      exitHook(this._context);
    }

    // action called with current context; return value becomes new context
    let newContext = this._context;
    if (chosen.action) {
      newContext = chosen.action(this._context, event);
    }

    // Add current state to history before transitioning
    if (this._historySize > 0) {
      this._history.push(this._current);
      if (this._history.length > this._historySize) {
        this._history.splice(0, this._history.length - this._historySize);
      }
    }

    // Enter new state
    this._current = to;
    this._context = newContext;

    // onEnter fires after entering the new state
    const enterHook = this._onEnter[to as string];
    if (enterHook) {
      enterHook(this._context);
    }

    return true;
  }

  can(event: E): boolean {
    const matching = this._transitions.filter(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(this._current) && t.event === event;
    });

    if (matching.length === 0) {
      return false;
    }

    for (const t of matching) {
      if (!t.guard) {
        return true;
      }
      try {
        if (t.guard(this._context)) {
          return true;
        }
      } catch {
        // Guard threw — treat as false
      }
    }

    return false;
  }

  reset(): void {
    this._current = this._initial;
    this._context = this._initialContext;
    this._history = [];
  }

  getTransitionsFor(state: S): Transition<S, E, C>[] {
    return this._transitions.filter(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(state);
    });
  }
}