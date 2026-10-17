// bloom-deps:

export interface DeepMergeOptions {
  arrayStrategy?: 'replace' | 'concat' | 'union';
  customMerge?: (key: string, a: unknown, b: unknown) => unknown;
}

function isPlainObject(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const ctor = (value as Record<string, unknown>).constructor;
  return ctor === Object || ctor === undefined;
}

function validateSource(source: unknown): void {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    throw new TypeError(
      `deepMerge: each source must be a plain object, got ${source === null ? 'null' : Array.isArray(source) ? 'array' : typeof source}`
    );
  }
  if (!isPlainObject(source)) {
    throw new TypeError(
      `deepMerge: each source must be a plain object (constructor must be Object or undefined)`
    );
  }
}

function mergeTwo(
  a: Record<string | symbol, unknown>,
  b: Record<string | symbol, unknown>,
  options: DeepMergeOptions
): Record<string | symbol, unknown> {
  const result: Record<string | symbol, unknown> = {};

  // Copy all string keys from a
  for (const key of Object.keys(a)) {
    result[key] = deepCopy(a[key]);
  }

  // Copy all symbol keys from a
  for (const sym of Object.getOwnPropertySymbols(a)) {
    result[sym] = deepCopy(a[sym]);
  }

  // Merge string keys from b
  for (const key of Object.keys(b)) {
    const aVal = result[key];
    const bVal = b[key];

    // Check customMerge first
    if (options.customMerge) {
      const custom = options.customMerge(key, aVal, bVal);
      if (custom !== undefined) {
        result[key] = custom;
        continue;
      }
    }

    // null in b overwrites anything
    if (bVal === null) {
      result[key] = null;
      continue;
    }

    // Both are arrays
    if (Array.isArray(bVal) && Array.isArray(aVal)) {
      const strategy = options.arrayStrategy ?? 'replace';
      if (strategy === 'replace') {
        result[key] = deepCopy(bVal);
      } else if (strategy === 'concat') {
        result[key] = [...(aVal as unknown[]).map(deepCopy), ...(bVal as unknown[]).map(deepCopy)];
      } else if (strategy === 'union') {
        const concatenated = [...(aVal as unknown[]).map(deepCopy), ...(bVal as unknown[]).map(deepCopy)];
        const union: unknown[] = [];
        for (const item of concatenated) {
          if (!union.some(existing => Object.is(existing, item))) {
            union.push(item);
          }
        }
        result[key] = union;
      }
      continue;
    }

    // b value is array but a is not (or vice versa): b wins
    if (Array.isArray(bVal)) {
      result[key] = deepCopy(bVal);
      continue;
    }

    // Both are plain objects: recurse
    if (isPlainObject(bVal) && isPlainObject(aVal)) {
      result[key] = mergeTwo(
        aVal as Record<string | symbol, unknown>,
        bVal as Record<string | symbol, unknown>,
        options
      );
      continue;
    }

    // Scalar or b is plain object but a is not: b wins
    result[key] = deepCopy(bVal);
  }

  // Merge symbol keys from b (symbol keys are carried, not recursively merged)
  for (const sym of Object.getOwnPropertySymbols(b)) {
    result[sym] = b[sym];
  }

  return result;
}

function deepCopy(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(deepCopy);
  }
  if (isPlainObject(value)) {
    const obj = value as Record<string | symbol, unknown>;
    const copy: Record<string | symbol, unknown> = {};
    for (const key of Object.keys(obj)) {
      copy[key] = deepCopy(obj[key]);
    }
    for (const sym of Object.getOwnPropertySymbols(obj)) {
      copy[sym] = obj[sym];
    }
    return copy;
  }
  // Non-plain objects (Date, Map, etc.) returned as-is
  return value;
}

export function deepMergeWith<T extends object>(options: DeepMergeOptions, ...sources: Partial<T>[]): T {
  if (sources.length === 0) {
    return {} as T;
  }

  for (const source of sources) {
    validateSource(source);
  }

  if (sources.length === 1) {
    return deepCopy(sources[0]) as T;
  }

  let result = deepCopy(sources[0]) as Record<string | symbol, unknown>;

  for (let i = 1; i < sources.length; i++) {
    result = mergeTwo(result, sources[i] as Record<string | symbol, unknown>, options);
  }

  return result as T;
}

export function deepMerge<T extends object>(...sources: Partial<T>[]): T {
  return deepMergeWith<T>({}, ...sources);
}