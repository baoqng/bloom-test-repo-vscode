// bloom-deps:

export interface DeepMergeOptions {
  arrayStrategy?: 'replace' | 'concat' | 'union';
  customMerge?: (key: string, a: unknown, b: unknown) => unknown;
}

function isPlainObject(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function validateSource(source: unknown): void {
  if (!isPlainObject(source)) {
    throw new TypeError(
      `deepMerge: all sources must be plain objects, got ${
        source === null ? 'null' : Array.isArray(source) ? 'array' : typeof source
      }`
    );
  }
}

function mergeTwo<T extends object>(
  target: Partial<T>,
  source: Partial<T>,
  options: DeepMergeOptions
): Partial<T> {
  const result: Record<string | symbol, unknown> = {};

  // Copy all string keys from target
  for (const key of Object.keys(target)) {
    result[key] = (target as Record<string, unknown>)[key];
  }

  // Copy all symbol keys from target
  for (const sym of Object.getOwnPropertySymbols(target)) {
    result[sym] = (target as Record<symbol, unknown>)[sym];
  }

  // Merge string keys from source
  for (const key of Object.keys(source)) {
    const aVal = (target as Record<string, unknown>)[key];
    const bVal = (source as Record<string, unknown>)[key];

    // Try customMerge first
    if (options.customMerge) {
      const custom = options.customMerge(key, aVal, bVal);
      if (custom !== undefined) {
        result[key] = custom;
        continue;
      }
    }

    // null in later source: overwrite
    if (bVal === null) {
      result[key] = null;
      continue;
    }

    // Both are arrays
    if (Array.isArray(bVal) && Array.isArray(aVal)) {
      const strategy = options.arrayStrategy ?? 'replace';
      if (strategy === 'replace') {
        result[key] = [...bVal];
      } else if (strategy === 'concat') {
        result[key] = [...aVal, ...bVal];
      } else {
        // union: concat then deduplicate by Object.is
        const combined = [...aVal, ...bVal];
        const seen: unknown[] = [];
        const deduped: unknown[] = [];
        for (const item of combined) {
          if (!seen.some(s => Object.is(s, item))) {
            seen.push(item);
            deduped.push(item);
          }
        }
        result[key] = deduped;
      }
      continue;
    }

    // bVal is array but aVal is not: just replace
    if (Array.isArray(bVal)) {
      result[key] = [...bVal];
      continue;
    }

    // Both are plain objects: recurse
    if (isPlainObject(bVal) && isPlainObject(aVal)) {
      result[key] = mergeTwo(
        aVal as Partial<object>,
        bVal as Partial<object>,
        options
      );
      continue;
    }

    // Scalar or bVal is plain object but aVal is not
    if (isPlainObject(bVal)) {
      result[key] = deepCopy(bVal as object);
      continue;
    }

    // Scalar
    result[key] = bVal;
  }

  // Carry symbol keys from source (overwrite target's symbol keys)
  for (const sym of Object.getOwnPropertySymbols(source)) {
    result[sym] = (source as Record<symbol, unknown>)[sym];
  }

  return result as Partial<T>;
}

function deepCopy<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(deepCopy) as unknown as T;
  }
  if (!isPlainObject(value)) return value;

  const result: Record<string | symbol, unknown> = Object.create(
    Object.getPrototypeOf(value)
  );

  for (const key of Object.keys(value as object)) {
    result[key] = deepCopy((value as Record<string, unknown>)[key]);
  }
  for (const sym of Object.getOwnPropertySymbols(value as object)) {
    result[sym] = deepCopy((value as Record<symbol, unknown>)[sym]);
  }
  return result as unknown as T;
}

export function deepMerge<T extends object>(...sources: Partial<T>[]): T {
  return deepMergeWith<T>({}, ...sources);
}

export function deepMergeWith<T extends object>(
  options: DeepMergeOptions,
  ...sources: Partial<T>[]
): T {
  for (const source of sources) {
    validateSource(source);
  }

  if (sources.length === 0) {
    return {} as T;
  }

  if (sources.length === 1) {
    return deepCopy(sources[0]) as T;
  }

  let result: Partial<T> = {};
  for (const source of sources) {
    result = mergeTwo(result, source, options);
  }

  return result as T;
}