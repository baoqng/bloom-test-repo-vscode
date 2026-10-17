// bloom-deps:

export type EasingFn = (t: number) => number;

export function linear(t: number): number {
  return t;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  return (t - 1) ** 3 + 1;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}

export function interpolate(from: number, to: number, t: number, easing?: EasingFn): number {
  if (typeof from !== 'number' || !Number.isFinite(from)) {
    throw new TypeError(`Expected finite number for 'from', got ${from}`);
  }
  if (typeof to !== 'number' || !Number.isFinite(to)) {
    throw new TypeError(`Expected finite number for 'to', got ${to}`);
  }
  if (typeof t !== 'number' || !Number.isFinite(t)) {
    throw new TypeError(`Expected finite number for 't', got ${t}`);
  }
  if (easing !== undefined && typeof easing !== 'function') {
    throw new TypeError(`Expected 'easing' to be a function, got ${typeof easing}`);
  }

  const easingFn: EasingFn = easing ?? linear;

  if (from === to) {
    return from;
  }

  return from + (to - from) * easingFn(t);
}