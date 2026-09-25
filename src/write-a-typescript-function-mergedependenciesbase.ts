// bloom-deps:

function isPlainObject(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype ||
    (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === null)
  );
}

export function mergeDependencies(
  base: Record<string, string>,
  overrides: Record<string, string>
): Record<string, string> {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    throw new TypeError('Dependencies must be objects');
  }

  return { ...base, ...overrides };
}