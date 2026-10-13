// bloom-deps:

export function deepEqual(a: unknown, b: unknown): boolean {
  return deepEqualInner(a, b, new Map());
}

function deepEqualInner(a: unknown, b: unknown, seen: Map<unknown, unknown>): boolean {
  // Handle NaN: NaN equals NaN
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    // +0 and -0 are equal (override Object.is which returns false)
    if (a === 0 && b === 0) return true;
    return Object.is(a, b);
  }

  // Primitives (non-object, non-function) — use Object.is but we already handled numbers
  if (typeof a !== 'object' && typeof a !== 'function' && typeof b !== 'object' && typeof b !== 'function') {
    return Object.is(a, b);
  }

  // null checks (typeof null === 'object')
  if (a === null || b === null) {
    return a === b;
  }

  // From here, both a and b are non-null objects (or functions, but we treat them as objects)

  // Different prototypes -> not equal
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  // Cycle detection
  if (seen.has(a)) {
    return seen.get(a) === b;
  }
  if (seen.has(b)) {
    return seen.get(b) === a;
  }
  seen.set(a, b);
  seen.set(b, a);

  try {
    // Date
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Map
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [keyA, valA] of a) {
        // Find matching key in b using SameValueZero
        let found = false;
        for (const [keyB, valB] of b) {
          if (sameValueZero(keyA, keyB)) {
            if (!deepEqualInner(valA, valB, seen)) return false;
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
      return true;
    }

    // Set
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const valA of a) {
        let found = false;
        for (const valB of b) {
          if (sameValueZero(valA, valB)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
      return true;
    }

    // Array
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;
    if (aIsArray && bIsArray) {
      const aArr = a as unknown[];
      const bArr = b as unknown[];
      if (aArr.length !== bArr.length) return false;
      for (let i = 0; i < aArr.length; i++) {
        if (!deepEqualInner(aArr[i], bArr[i], seen)) return false;
      }
      return true;
    }

    // Plain objects (same prototype already verified above)
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keysA = Object.keys(aObj);
    const keysB = Object.keys(bObj);
    if (keysA.length !== keysB.length) return false;
    const keysBSet = new Set(keysB);
    for (const key of keysA) {
      if (!keysBSet.has(key)) return false;
      if (!deepEqualInner(aObj[key], bObj[key], seen)) return false;
    }
    return true;
  } finally {
    seen.delete(a);
    seen.delete(b);
  }
}

function sameValueZero(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    // SameValueZero: +0 === -0
    return a === b;
  }
  return Object.is(a, b);
}