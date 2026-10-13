// bloom-deps:

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

interface DiffOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: unknown;
}

function isJsonCompatible(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonCompatible);
  }
  if (typeof value === 'object' && value !== null) {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype) {
      return false;
    }
    return Object.values(value).every(isJsonCompatible);
  }
  return false;
}

function isPlainObject(value: unknown): value is { [key: string]: JsonValue } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype;
}

function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a !== typeof b) {
    return false;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => key in b && deepEqual(a[key], b[key]));
  }
  return false;
}

function escapePath(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

function diff(before: unknown, after: unknown): DiffOperation[] {
  if (!isJsonCompatible(before)) {
    throw new TypeError('before is not JSON-compatible');
  }
  if (!isJsonCompatible(after)) {
    throw new TypeError('after is not JSON-compatible');
  }

  const operations: DiffOperation[] = [];

  function visit(beforeVal: JsonValue, afterVal: JsonValue, path: string): void {
    if (deepEqual(beforeVal, afterVal)) {
      return;
    }

    if (isPlainObject(beforeVal) && isPlainObject(afterVal)) {
      const beforeKeys = new Set(Object.keys(beforeVal));
      const afterKeys = new Set(Object.keys(afterVal));
      const allKeys = new Set([...beforeKeys, ...afterKeys]);
      const sortedKeys = Array.from(allKeys).sort();

      for (const key of sortedKeys) {
        const childPath = `${path}/${escapePath(key)}`;
        const inBefore = beforeKeys.has(key);
        const inAfter = afterKeys.has(key);

        if (!inBefore && inAfter) {
          operations.push({
            op: 'add',
            path: childPath,
            value: afterVal[key],
          });
        } else if (inBefore && !inAfter) {
          operations.push({
            op: 'remove',
            path: childPath,
          });
        } else {
          visit(beforeVal[key], afterVal[key], childPath);
        }
      }
    } else {
      operations.push({
        op: 'replace',
        path: path,
        value: afterVal,
      });
    }
  }

  visit(before as JsonValue, after as JsonValue, '');
  return operations;
}

export { diff, DiffOperation };