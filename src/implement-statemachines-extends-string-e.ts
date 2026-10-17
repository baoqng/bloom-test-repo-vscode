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

const DEFAULT_HISTORY_SIZE = 10;

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
    const historySize = config.historySize ?? DEFAULT_HISTORY_SIZE;

    if (historySize < 0) {
      throw new RangeError(`historySize must be >= 0, got ${historySize}`);
    }

    // Check that the initial state has at least one outgoing transition
    const initialState = config.initial;
    const hasOutgoing = config.transitions.some(t => {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      return froms.includes(initialState);
    });
    if (!hasOutgoing) {
      throw new TypeError(`Initial state '${initialState}' has no outgoing transitions`);
    }

    this._initial = config.initial;
    this._initialContext = config.context as C;
    this._context = config.context as C;
    this._transitions = config.transitions;
    this._onEnter = config.onEnter ?? {};
    this._onExit = config.onExit ?? {};
    this._historySize = historySize;
    this._history = [];
    this._current = config.initial;
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
    const matching = this._findMatchingTransition(this._current, event);
    if (matching === null) {
      return false;
    }

    const { transition } = matching;

    // onExit fires before action
    const exitHandler = this._onExit[this._current as string];
    if (exitHandler) {
      exitHandler(this._context);
    }

    // action called with current context before entering new state
    let newContext = this._context;
    if (transition.action) {
      newContext = transition.action(this._context, event);
    }

    // Add current state to history before changing
    if (this._historySize > 0) {
      this._history.push(this._current);
      if (this._history.length > this._historySize) {
        this._history = this._history.slice(this._history.length - this._historySize);
      }
    }

    // Enter new state
    this._current = transition.to;
    this._context = newContext;

    // onEnter fires after entering new state
    const enterHandler = this._onEnter[transition.to as string];
    if (enterHandler) {
      enterHandler(this._context);
    }

    return true;
  }

  can(event: E): boolean {
    return this._findMatchingTransition(this._current, event) !== null;
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

  private _findMatchingTransition(
    state: S,
    event: E
  ): { transition: Transition<S, E, C> } | null {
    for (const t of this._transitions) {
      const froms = Array.isArray(t.from) ? t.from : [t.from];
      if (!froms.includes(state)) continue;
      if (t.event !== event) continue;

      // Evaluate guard
      if (t.guard) {
        let guardResult = false;
        try {
          guardResult = t.guard(this._context);
        } catch {
          guardResult = false;
        }
        if (!guardResult) continue;
      }

      return { transition: t };
    }
    return null;
  }
}