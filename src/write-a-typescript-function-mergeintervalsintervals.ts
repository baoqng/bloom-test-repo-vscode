// bloom-deps:

export function mergeIntervals(intervals: unknown): Array<[number, number]> {
  if (!Array.isArray(intervals)) {
    throw new TypeError('intervals must be an array');
  }

  // Validate all elements first before any processing
  for (let i = 0; i < intervals.length; i++) {
    const el = intervals[i];
    if (!Array.isArray(el)) {
      throw new TypeError(`Element at index ${i} must be an array`);
    }
    if (el.length !== 2) {
      throw new TypeError(`Element at index ${i} must have exactly two elements`);
    }
    const [start, end] = el;
    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new TypeError(`Element at index ${i} must contain numbers`);
    }
    if (!isFinite(start) || !isFinite(end)) {
      throw new TypeError(`Element at index ${i} must contain finite numbers`);
    }
    if (start > end) {
      throw new RangeError(`Element at index ${i} has start greater than end`);
    }
  }

  if (intervals.length === 0) {
    return [];
  }

  // Create a sorted copy without mutating the input
  const sorted: Array<[number, number]> = intervals
    .map((el: any) => [el[0], el[1]] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const result: Array<[number, number]> = [];

  for (const interval of sorted) {
    if (result.length === 0) {
      result.push([interval[0], interval[1]]);
    } else {
      const last = result[result.length - 1];
      // Merge if overlap or touching (last[1] >= interval[0])
      if (last[1] >= interval[0]) {
        result[result.length - 1] = [last[0], Math.max(last[1], interval[1])];
      } else {
        result.push([interval[0], interval[1]]);
      }
    }
  }

  return result;
}