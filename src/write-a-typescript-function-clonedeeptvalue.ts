// bloom-deps:

export function cloneDeep<T>(value: T): T {
  const seen = new Map<object, object>();
  return cloneValue(value, seen) as T;
}

function cloneValue(value: unknown, seen: Map<object, object>): unknown {
  // Primitives pass through
  if (value === null || value === undefined) return value;

  const type = typeof value;

  if (type === 'boolean' || type === 'number' || type === 'string' || type === 'bigint') {
    return value;
  }

  if (type === 'symbol') {
    throw new TypeError('Cannot clone symbol values');
  }

  if (type === 'function') {
    throw new TypeError('Cannot clone function values');
  }

  // From here, value is an object
  const obj = value as object;

  // Check seen map for cycles/shared references
  if (seen.has(obj)) {
    return seen.get(obj);
  }

  // Array
  if (Array.isArray(obj)) {
    const arr: unknown[] = [];
    seen.set(obj, arr);
    const srcArr = obj as unknown[];
    for (let i = 0; i < srcArr.length; i++) {
      // Array holes become undefined elements
      arr[i] = cloneValue(srcArr[i], seen);
    }
    return arr;
  }

  // Date
  if (obj instanceof Date) {
    const clonedDate = new Date(obj.getTime());
    seen.set(obj, clonedDate);
    return clonedDate;
  }

  // Map
  if (obj instanceof Map) {
    const clonedMap = new Map<unknown, unknown>();
    seen.set(obj, clonedMap);
    for (const [k, v] of obj) {
      clonedMap.set(cloneValue(k, seen), cloneValue(v, seen));
    }
    return clonedMap;
  }

  // Set
  if (obj instanceof Set) {
    const clonedSet = new Set<unknown>();
    seen.set(obj, clonedSet);
    for (const v of obj) {
      clonedSet.add(cloneValue(v, seen));
    }
    return clonedSet;
  }

  // Check prototype for plain objects
  const proto = Object.getPrototypeOf(obj);

  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError(
      `Cannot clone class instance: prototype is neither Object.prototype nor null`
    );
  }

  // Plain object (with Object.prototype or null prototype)
  const clonedObj: Record<string, unknown> = proto === null
    ? Object.create(null)
    : {};

  seen.set(obj, clonedObj);

  const keys = Object.keys(obj) as string[];
  for (const key of keys) {
    clonedObj[key] = cloneValue((obj as Record<string, unknown>)[key], seen);
  }

  return clonedObj;
}