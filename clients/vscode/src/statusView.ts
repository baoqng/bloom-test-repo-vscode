// bloom-deps:

export function mergeJobMaps<T>(base: Map<string, T>, update: Map<string, T>): Map<string, T> {
  if (!(base instanceof Map)) {
    throw new TypeError('base must be a Map instance');
  }
  if (!(update instanceof Map)) {
    throw new TypeError('update must be a Map instance');
  }

  const result = new Map<string, T>();

  for (const [key, value] of base) {
    result.set(key, value);
  }

  for (const [key, value] of update) {
    result.set(key, value);
  }

  return result;
}