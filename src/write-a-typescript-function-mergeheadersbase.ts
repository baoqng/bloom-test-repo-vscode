// bloom-deps:

export function mergeHeaders(base: unknown, overrides: unknown): Record<string, string> {
  function validateInput(arg: unknown, argName: string): Record<string, unknown> {
    if (arg === undefined) {
      return {};
    }
    if (arg === null) {
      throw new TypeError(`${argName} must not be null`);
    }
    if (Array.isArray(arg)) {
      throw new TypeError(`${argName} must not be an array`);
    }
    if (typeof arg !== 'object') {
      throw new TypeError(`${argName} must be an object`);
    }
    return arg as Record<string, unknown>;
  }

  const baseObj = validateInput(base, 'base');
  const overridesObj = validateInput(overrides, 'overrides');

  const result: Record<string, string> = {};

  for (const key of Object.keys(baseObj)) {
    const value = baseObj[key];
    if (typeof value !== 'string') {
      throw new TypeError(`Header '${key}' value must be a string`);
    }
    result[key.toLowerCase()] = value;
  }

  for (const key of Object.keys(overridesObj)) {
    const value = overridesObj[key];
    if (typeof value !== 'string') {
      throw new TypeError(`Header '${key}' value must be a string`);
    }
    const lowerKey = key.toLowerCase();
    if (value === '') {
      delete result[lowerKey];
    } else {
      result[lowerKey] = value;
    }
  }

  return result;
}