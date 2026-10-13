export function deepEqual(a: unknown, b: unknown): boolean {
  const visited = new Map<object, Set<object>>();

  function compare(x: unknown, y: unknown): boolean {
    // Handle NaN equality: NaN equals NaN
    if (typeof x === 'number' && typeof y === 'number') {
      if (Number.isNaN(x) && Number.isNaN(y)) {
        return true;
      }
      // Handle +0 and -0 equality
      if (x === 0 && y === 0) {
        return true;
      }
      // Regular number comparison
      return x === y;
    }

    // Primitive comparison using Object.is semantics (except +0/-0 and NaN handled above)
    if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) {
      return Object.is(x, y);
    }

    // Check if both are the same object reference (handles cycles)
    if (x === y) {
      return true;
    }

    // Check for cycles: if we've already started comparing x with y, assume equal
    const xObj = x as object;
    const yObj = y as object;
    if (visited.has(xObj)) {
      const pairedWith = visited.get(xObj)!;
      if (pairedWith.has(yObj)) {
        return true;
      }
    }

    // Mark this pair as being compared
    if (!visited.has(xObj)) {
      visited.set(xObj, new Set());
    }
    visited.get(xObj)!.add(yObj);

    if (!visited.has(yObj)) {
      visited.set(yObj, new Set());
    }
    visited.get(yObj)!.add(xObj);

    // Handle arrays
    if (Array.isArray(x) && Array.isArray(y)) {
      if (x.length !== y.length) {
        return false;
      }
      for (let i = 0; i < x.length; i++) {
        if (!compare(x[i], y[i])) {
          return false;
        }
      }
      return true;
    }

    // Array vs non-array: not equal
    if (Array.isArray(x) || Array.isArray(y)) {
      return false;
    }

    // Handle Date objects
    if (x instanceof Date && y instanceof Date) {
      return x.getTime() === y.getTime();
    }

    // Different types of objects
    if (Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)) {
      return false;
    }

    // Handle Map
    if (x instanceof Map && y instanceof Map) {
      if (x.size !== y.size) {
        return false;
      }
      for (const [key, value] of x) {
        if (!y.has(key)) {
          return false;
        }
        if (!compare(value, y.get(key))) {
          return false;
        }
      }
      return true;
    }

    // Handle Set
    if (x instanceof Set && y instanceof Set) {
      if (x.size !== y.size) {
        return false;
      }
      for (const value of x) {
        let found = false;
        for (const yValue of y) {
          if (compare(value, yValue)) {
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      return true;
    }

    // Handle plain objects
    if (Object.getPrototypeOf(x) === Object.prototype && Object.getPrototypeOf(y) === Object.prototype) {
      const xRec = x as Record<string, unknown>;
      const yRec = y as Record<string, unknown>;

      const xKeys = Object.keys(xRec);
      const yKeys = Object.keys(yRec);

      if (xKeys.length !== yKeys.length) {
        return false;
      }

      const yKeySet = new Set(yKeys);

      for (const key of xKeys) {
        if (!yKeySet.has(key)) {
          return false;
        }
        if (!compare(xRec[key], yRec[key])) {
          return false;
        }
      }

      return true;
    }

    // Different prototype chain or unknown object type
    return false;
  }

  return compare(a, b);
}