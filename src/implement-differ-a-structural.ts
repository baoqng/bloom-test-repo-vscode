// bloom-deps:

type DiffOp =
  | { op: 'add';     path: string; value: unknown }
  | { op: 'remove';  path: string; value: unknown }
  | { op: 'replace'; path: string; oldValue: unknown; newValue: unknown };

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function diffRecurse(before: unknown, after: unknown, path: string, ops: DiffOp[]): void {
  // Type change: one is object, other is array — treat as replace, no recurse
  if (isObject(before) && isArray(after)) {
    ops.push({ op: 'replace', path, oldValue: before, newValue: after });
    return;
  }
  if (isArray(before) && isObject(after)) {
    ops.push({ op: 'replace', path, oldValue: before, newValue: after });
    return;
  }

  // Both are plain objects
  if (isObject(before) && isObject(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    for (const key of keys) {
      const childPath = `${path}/${key}`;
      const hasInBefore = Object.prototype.hasOwnProperty.call(before, key);
      const hasInAfter = Object.prototype.hasOwnProperty.call(after, key);
      if (hasInBefore && !hasInAfter) {
        ops.push({ op: 'remove', path: childPath, value: before[key] });
      } else if (!hasInBefore && hasInAfter) {
        ops.push({ op: 'add', path: childPath, value: after[key] });
      } else {
        // Key in both — recurse
        diffRecurse(before[key], after[key], childPath, ops);
      }
    }
    return;
  }

  // Both are arrays
  if (isArray(before) && isArray(after)) {
    const maxLen = Math.max(before.length, after.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}/${i}`;
      if (i >= before.length) {
        // Extra index in after
        ops.push({ op: 'add', path: childPath, value: after[i] });
      } else if (i >= after.length) {
        // Missing index in after
        ops.push({ op: 'remove', path: childPath, value: before[i] });
      } else {
        // Same index in both — recurse
        diffRecurse(before[i], after[i], childPath, ops);
      }
    }
    return;
  }

  // Primitive comparison (includes null)
  if (before === after) {
    return;
  }
  ops.push({ op: 'replace', path, oldValue: before, newValue: after });
}

export function differ(before: unknown, after: unknown): DiffOp[] {
  const ops: DiffOp[] = [];
  diffRecurse(before, after, '', ops);
  return ops;
}