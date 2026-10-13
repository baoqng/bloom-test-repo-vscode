// bloom-deps:

export function stableStringify(value: unknown): string {
  const seen = new Set<object>();
  return _serialize(value, seen, true);
}

function _serialize(value: unknown, seen: Set<object>, topLevel: boolean): string {
  // Handle toJSON first if it's an object with that method
  if (value !== null && typeof value === 'object' && typeof (value as any).toJSON === 'function') {
    value = (value as any).toJSON();
  }

  // bigint check
  if (typeof value === 'bigint') {
    throw new TypeError('Do not know how to serialize a BigInt');
  }

  // top-level undefined/function/symbol
  if (topLevel) {
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      throw new TypeError(
        `Cannot serialize top-level ${typeof value === 'undefined' ? 'undefined' : typeof value}`
      );
    }
  }

  // null
  if (value === null) {
    return 'null';
  }

  // undefined (non-top-level — callers handle array vs object context)
  if (value === undefined) {
    return 'undefined_sentinel';
  }

  // function or symbol (non-top-level)
  if (typeof value === 'function' || typeof value === 'symbol') {
    return 'skip_sentinel';
  }

  // boolean
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // number
  if (typeof value === 'number') {
    // NaN and Infinity become null
    if (!isFinite(value)) {
      return 'null';
    }
    // -0 becomes 0
    if (Object.is(value, -0)) {
      return '0';
    }
    return JSON.stringify(value);
  }

  // string
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  // object or array
  if (typeof value === 'object') {
    // Check for bigint boxed object (unlikely but safe)
    if (typeof value === 'object' && value !== null) {
      // Cycle detection
      if (seen.has(value)) {
        throw new TypeError('circular reference detected');
      }
      seen.add(value);

      let result: string;

      if (Array.isArray(value)) {
        const items = (value as unknown[]).map((item) => {
          // After toJSON resolution for nested items
          let v = item;
          if (v !== null && typeof v === 'object' && typeof (v as any).toJSON === 'function') {
            v = (v as any).toJSON();
          }
          if (typeof v === 'bigint') {
            seen.delete(value);
            throw new TypeError('Do not know how to serialize a BigInt');
          }
          if (v === undefined || typeof v === 'function' || typeof v === 'symbol') {
            return 'null';
          }
          const serialized = _serialize(item, seen, false);
          if (serialized === 'undefined_sentinel' || serialized === 'skip_sentinel') {
            return 'null';
          }
          return serialized;
        });
        result = '[' + items.join(',') + ']';
      } else {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj).sort();
        const parts: string[] = [];
        for (const k of keys) {
          const v = obj[k];
          // Resolve toJSON for property value
          let resolved = v;
          if (resolved !== null && typeof resolved === 'object' && typeof (resolved as any).toJSON === 'function') {
            resolved = (resolved as any).toJSON();
          }
          if (typeof resolved === 'bigint') {
            seen.delete(value);
            throw new TypeError('Do not know how to serialize a BigInt');
          }
          // Skip undefined, function, symbol in objects
          if (resolved === undefined || typeof resolved === 'function' || typeof resolved === 'symbol') {
            continue;
          }
          const serialized = _serialize(v, seen, false);
          if (serialized === 'undefined_sentinel' || serialized === 'skip_sentinel') {
            continue;
          }
          parts.push(JSON.stringify(k) + ':' + serialized);
        }
        result = '{' + parts.join(',') + '}';
      }

      seen.delete(value);
      return result;
    }
  }

  // fallback
  return 'null';
}