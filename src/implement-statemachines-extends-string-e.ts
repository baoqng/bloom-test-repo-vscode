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

    this._transitions = config.transitions;
    this._onEnter = config.onEnter ?? {};
    this._onExit = config.onExit ?? {};
    this._historySize = historySize;
    this._initial = config.initial;
    this._initialContext = config.context as C;
    this._current = config.initial;
    this._context = config.context as C;
    this._history = [];

    // Validate: initial state must have outgoing transitions or be a terminal state.
    // A terminal state has no outgoing transitions but IS reachable (appears as a 'to' target)
    // AND has no outgoing transitions itself.
    // If initial has no outgoing transitions, it must not appear as a 'from' in any transition.
    // We throw TypeError if initial has no outgoing transitions, unless it qualifies as terminal.
    // Terminal means: it appears as 'to' target of some transition AND has no outgoing transitions.
    // But the test case has initial='running' with transitions=[{from:'idle', event:'start', to:'running'}]
    // Here 'running' IS a 'to' target, yet the test expects TypeError.
    // So the rule is: initial state MUST have at least one outgoing transition, period.
    // Unless there are no transitions at all.
    const hasAnyTransitions = this._transitions.length > 0;
    if (hasAnyTransitions) {
      const initialHasOutgoing = this._transitions.some(t => {
        const froms = Array.isArray(t.from) ? t.from : [t.from];
        return froms.includes(this._initial);
      });
      if (!initialHasOutgoing) {
        throw new TypeError(
          `Initial state "${this._initial}" has no outgoing transitions defined.`
        );
      }
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

  private _getMatchingTransition(state: S, event: E): Transition<S, E, C> | null {
    for (const t of this._transitions) {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      if (!froms.includes(state)) continue;
      if (t.event !== event) continue;

      if (t.guard) {
        let guardResult = false;
        try {
          guardResult = t.guard(this._context);
        } catch {
          guardResult = false;
        }
        if (!guardResult) continue;
      }

      return t;
    }
    return null;
  }

  send(event: E): boolean {
    const transition = this._getMatchingTransition(this._current, event);
    if (transition === null) {
      return false;
    }

    const fromState = this._current;
    const toState = transition.to;

    // onExit fires before action
    const exitHandler = this._onExit[fromState as string];
    if (exitHandler) {
      exitHandler(this._context);
    }

    // action called with current context before entering new state
    let newContext = this._context;
    if (transition.action) {
      newContext = transition.action(this._context, event);
    }

    // Add current state to history before transitioning
    if (this._historySize > 0) {
      this._history.push(fromState);
      if (this._history.length > this._historySize) {
        this._history = this._history.slice(this._history.length - this._historySize);
      }
    }

    // Enter new state
    this._current = toState;
    this._context = newContext;

    // onEnter fires after entering the new state
    const enterHandler = this._onEnter[toState as string];
    if (enterHandler) {
      enterHandler(this._context);
    }

    return true;
  }

  can(event: E): boolean {
    return this._getMatchingTransition(this._current, event) !== null;
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