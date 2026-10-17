// bloom-deps:

export interface GroupAggOptions<T> {
  by: (item: T) => string | number;
  aggregations: Record<string, Aggregation<T>>;
}

export type Aggregation<T> =
  | { type: 'count' }
  | { type: 'sum'; field: (item: T) => number }
  | { type: 'avg'; field: (item: T) => number }
  | { type: 'min'; field: (item: T) => number }
  | { type: 'max'; field: (item: T) => number }
  | { type: 'first'; field: (item: T) => unknown }
  | { type: 'last'; field: (item: T) => unknown }
  | { type: 'collect'; field: (item: T) => unknown };

export interface GroupResult {
  key: string | number;
  count: number;
  [aggName: string]: unknown;
}

export function groupAndAggregate<T>(items: T[], options: GroupAggOptions<T>): GroupResult[] {
  if (!Array.isArray(items)) {
    throw new TypeError('items must be an array');
  }

  if (typeof options.by !== 'function') {
    throw new TypeError('options.by must be a function');
  }

  // Validate aggregation field extractors
  for (const [aggName, agg] of Object.entries(options.aggregations)) {
    if (agg.type !== 'count') {
      if (typeof (agg as any).field !== 'function') {
        throw new TypeError(
          `aggregation "${aggName}" of type "${agg.type}" requires a field function`
        );
      }
    }
  }

  if (items.length === 0) {
    return [];
  }

  // Group items preserving insertion order of first occurrence
  const groupMap = new Map<string | number, T[]>();
  for (const item of items) {
    const key = options.by(item);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(item);
  }

  const results: GroupResult[] = [];

  for (const [key, groupItems] of groupMap) {
    const result: GroupResult = {
      key,
      count: groupItems.length,
    };

    for (const [aggName, agg] of Object.entries(options.aggregations)) {
      switch (agg.type) {
        case 'count': {
          result[aggName] = groupItems.length;
          break;
        }
        case 'sum': {
          let sum = 0;
          for (const item of groupItems) {
            const val = agg.field(item);
            if (Number.isFinite(val)) {
              sum += val;
            }
          }
          result[aggName] = sum;
          break;
        }
        case 'avg': {
          let sum = 0;
          let count = 0;
          for (const item of groupItems) {
            const val = agg.field(item);
            if (Number.isFinite(val)) {
              sum += val;
              count++;
            }
          }
          result[aggName] = count === 0 ? NaN : sum / count;
          break;
        }
        case 'min': {
          let min = NaN;
          for (const item of groupItems) {
            const val = agg.field(item);
            if (Number.isFinite(val)) {
              if (isNaN(min) || val < min) {
                min = val;
              }
            }
          }
          result[aggName] = min;
          break;
        }
        case 'max': {
          let max = NaN;
          for (const item of groupItems) {
            const val = agg.field(item);
            if (Number.isFinite(val)) {
              if (isNaN(max) || val > max) {
                max = val;
              }
            }
          }
          result[aggName] = max;
          break;
        }
        case 'first': {
          result[aggName] = agg.field(groupItems[0]);
          break;
        }
        case 'last': {
          result[aggName] = agg.field(groupItems[groupItems.length - 1]);
          break;
        }
        case 'collect': {
          result[aggName] = groupItems.map((item) => agg.field(item));
          break;
        }
      }
    }

    results.push(result);
  }

  return results;
}