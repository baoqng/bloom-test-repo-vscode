// bloom-deps:

function deduplicate<T>(items: T[], keyFn?: (item: T) => unknown): T[] {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  const readonlyItems: ReadonlyArray<T> = items;
  const effectiveKeyFn: (item: T) => unknown = keyFn !== undefined ? keyFn : (item: T) => item;
  const seen = new Set<any>();

  return readonlyItems.filter((element: T) => {
    const key = effectiveKeyFn(element);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export { deduplicate };