type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };

interface DiffOperation {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: JSONValue;
}

function isPlainObject(value: unknown): value is Record<string, JSONValue> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isJSONCompatible(value: unknown): value is JSONValue {
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
    return value.every((item) => isJSONCompatible(item));
  }
  if (isPlainObject(value)) {
    return Object.values(value).every((item) => isJSONCompatible(item));
  }
  return false;
}

function escapePath(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

function deepEqual(a: JSONValue, b: JSONValue): boolean {
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
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every((key) => key in b && deepEqual(a[key], b[key]));
  }
  return false;
}

function diff(before: unknown, after: unknown): DiffOperation[] {
  if (!isJSONCompatible(before) || !isJSONCompatible(after)) {
    throw new TypeError('Input values must be JSON-compatible');
  }

  if (deepEqual(before, after)) {
    return [];
  }

  const operations: DiffOperation[] = [];

  function diffRecursive(beforeVal: JSONValue, afterVal: JSONValue, path: string): void {
    if (deepEqual(beforeVal, afterVal)) {
      return;
    }

    if (isPlainObject(beforeVal) && isPlainObject(afterVal)) {
      const allKeys = new Set([...Object.keys(beforeVal), ...Object.keys(afterVal)]);
      const sortedKeys = Array.from(allKeys).sort();

      for (const key of sortedKeys) {
        const beforeHasKey = key in beforeVal;
        const afterHasKey = key in afterVal;
        const newPath = `${path}/${escapePath(key)}`;

        if (!beforeHasKey && afterHasKey) {
          operations.push({
            op: 'add',
            path: newPath,
            value: afterVal[key],
          });
        } else if (beforeHasKey && !afterHasKey) {
          operations.push({
            op: 'remove',
            path: newPath,
          });
        } else if (beforeHasKey && afterHasKey) {
          diffRecursive(beforeVal[key], afterVal[key], newPath);
        }
      }
    } else {
      operations.push({
        op: 'replace',
        path,
        value: afterVal,
      });
    }
  }

  diffRecursive(before, after, '');
  return operations;
}

export { diff };