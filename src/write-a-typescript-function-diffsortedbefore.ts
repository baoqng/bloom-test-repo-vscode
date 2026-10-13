// bloom-deps:

export function diffSorted(
  before: unknown,
  after: unknown
): { added: number[]; removed: number[]; unchanged: number } {
  if (!Array.isArray(before)) {
    throw new TypeError("'before' must be an array");
  }
  if (!Array.isArray(after)) {
    throw new TypeError("'after' must be an array");
  }

  for (let i = 0; i < before.length; i++) {
    const val = before[i];
    if (!Number.isSafeInteger(val)) {
      throw new TypeError(
        `'before' contains a non-safe-integer element at index ${i}: ${String(val)}`
      );
    }
  }

  for (let i = 0; i < after.length; i++) {
    const val = after[i];
    if (!Number.isSafeInteger(val)) {
      throw new TypeError(
        `'after' contains a non-safe-integer element at index ${i}: ${String(val)}`
      );
    }
  }

  for (let i = 1; i < before.length; i++) {
    if ((before[i] as number) <= (before[i - 1] as number)) {
      throw new RangeError(
        `'before' is not strictly ascending: element at index ${i} (${before[i]}) is not greater than element at index ${i - 1} (${before[i - 1]})`
      );
    }
  }

  for (let i = 1; i < after.length; i++) {
    if ((after[i] as number) <= (after[i - 1] as number)) {
      throw new RangeError(
        `'after' is not strictly ascending: element at index ${i} (${after[i]}) is not greater than element at index ${i - 1} (${after[i - 1]})`
      );
    }
  }

  const added: number[] = [];
  const removed: number[] = [];
  let unchanged = 0;

  let bi = 0;
  let ai = 0;

  const beforeArr = before as number[];
  const afterArr = after as number[];

  while (bi < beforeArr.length && ai < afterArr.length) {
    const bVal = beforeArr[bi];
    const aVal = afterArr[ai];

    if (bVal === aVal) {
      unchanged++;
      bi++;
      ai++;
    } else if (bVal < aVal) {
      removed.push(bVal);
      bi++;
    } else {
      added.push(aVal);
      ai++;
    }
  }

  while (bi < beforeArr.length) {
    removed.push(beforeArr[bi]);
    bi++;
  }

  while (ai < afterArr.length) {
    added.push(afterArr[ai]);
    ai++;
  }

  return { added, removed, unchanged };
}