// bloom-deps:

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isTraversable(value: unknown): boolean {
  return isPlainObject(value) || Array.isArray(value);
}

export function findDeep<T>(
  obj: unknown,
  predicate: (value: unknown, path: string) => boolean
): { value: T; path: string } | null {
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }

  if (!isTraversable(obj)) {
    return null;
  }

  const visited = new Set<object>();

  function traverse(current: unknown, path: string): { value: T; path: string } | null {
    if (isTraversable(current)) {
      const currentObj = current as object;
      if (visited.has(currentObj)) {
        return null;
      }
      visited.add(currentObj);

      if (Array.isArray(current)) {
        for (let i = 0; i < current.length; i++) {
          const childPath = path === '' ? `[${i}]` : `${path}[${i}]`;
          const result = traverse(current[i], childPath);
          if (result !== null) return result;
        }
      } else {
        const plainObj = current as Record<string, unknown>;
        for (const key of Object.keys(plainObj)) {
          const childPath = path === '' ? key : `${path}.${key}`;
          const result = traverse(plainObj[key], childPath);
          if (result !== null) return result;
        }
      }

      return null;
    } else {
      // Leaf value (including Date, RegExp, primitives, null, etc.)
      if (predicate(current, path)) {
        return { value: current as T, path };
      }
      return null;
    }
  }

  return traverse(obj, '');
}