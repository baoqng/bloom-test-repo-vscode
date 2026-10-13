// bloom-deps:

export function buildQueryString(params: unknown): string {
  // Validate that params is a plain object
  if (params === null || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('params must be a plain object');
  }

  // Reject class instances (non-plain objects)
  const proto = Object.getPrototypeOf(params);
  if (proto !== null && proto !== Object.prototype) {
    throw new TypeError('params must be a plain object');
  }

  const obj = params as Record<string, unknown>;
  const parts: string[] = [];

  // Sort keys in ascending code-unit order
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const encodedKey = encodeURIComponent(key);
    const value = obj[key];

    if (Array.isArray(value)) {
      // Emit key once per element
      for (const element of value) {
        if (element === undefined) {
          // Omit undefined elements
          continue;
        }
        if (element === null) {
          parts.push(encodedKey);
        } else if (Array.isArray(element)) {
          throw new TypeError('Nested arrays are not allowed');
        } else if (typeof element === 'object') {
          throw new TypeError('Object elements in arrays are not allowed');
        } else if (typeof element === 'function') {
          throw new TypeError('Function elements are not allowed');
        } else if (typeof element === 'symbol') {
          throw new TypeError('Symbol elements are not allowed');
        } else if (typeof element === 'bigint') {
          throw new TypeError('BigInt elements are not allowed');
        } else if (typeof element === 'number') {
          if (!isFinite(element)) {
            throw new TypeError('Non-finite number elements are not allowed');
          }
          parts.push(`${encodedKey}=${encodeURIComponent(String(element))}`);
        } else if (typeof element === 'string' || typeof element === 'boolean') {
          parts.push(`${encodedKey}=${encodeURIComponent(String(element))}`);
        } else {
          throw new TypeError(`Unsupported element type: ${typeof element}`);
        }
      }
    } else if (value === undefined) {
      // Omit entirely
      continue;
    } else if (value === null) {
      parts.push(encodedKey);
    } else if (typeof value === 'string') {
      parts.push(`${encodedKey}=${encodeURIComponent(value)}`);
    } else if (typeof value === 'boolean') {
      parts.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    } else if (typeof value === 'number') {
      if (!isFinite(value)) {
        throw new TypeError('Non-finite numbers are not allowed');
      }
      parts.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    } else if (typeof value === 'function') {
      throw new TypeError('Function values are not allowed');
    } else if (typeof value === 'symbol') {
      throw new TypeError('Symbol values are not allowed');
    } else if (typeof value === 'bigint') {
      throw new TypeError('BigInt values are not allowed');
    } else if (typeof value === 'object') {
      throw new TypeError('Object values are not allowed');
    } else {
      throw new TypeError(`Unsupported value type: ${typeof value}`);
    }
  }

  return parts.join('&');
}