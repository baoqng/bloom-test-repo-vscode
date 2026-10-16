// bloom-deps:

export type DiffLine = { type: 'equal' | 'insert' | 'delete'; line: string; oldLineNo?: number; newLineNo?: number };
export type DiffHunk = { oldStart: number; oldCount: number; newStart: number; newCount: number; lines: DiffLine[] };

export function diffLines(oldText: string, newText: string, contextLines?: number): DiffHunk[] {
  if (typeof oldText !== 'string') {
    throw new TypeError('oldText must be a string');
  }
  if (typeof newText !== 'string') {
    throw new TypeError('newText must be a string');
  }

  const ctx = contextLines === undefined ? 3 : contextLines;

  if (ctx < 0) {
    throw new RangeError('contextLines must be >= 0');
  }

  if (oldText === newText) {
    return [];
  }

  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Myers diff
  const editScript = computeEditScript(oldLines, newLines);

  // editScript is an array parallel to a merged sequence
  // Each entry: { type, oldIdx, newIdx }
  // Build flat list of DiffLine with line numbers
  const flatLines: DiffLine[] = editScript.map(entry => {
    if (entry.type === 'equal') {
      return {
        type: 'equal',
        line: oldLines[entry.oldIdx!],
        oldLineNo: entry.oldIdx! + 1,
        newLineNo: entry.newIdx! + 1,
      };
    } else if (entry.type === 'delete') {
      return {
        type: 'delete',
        line: oldLines[entry.oldIdx!],
        oldLineNo: entry.oldIdx! + 1,
      };
    } else {
      return {
        type: 'insert',
        line: newLines[entry.newIdx!],
        newLineNo: entry.newIdx! + 1,
      };
    }
  });

  // Find indices of changed lines in flatLines
  const changedIndices: number[] = [];
  for (let i = 0; i < flatLines.length; i++) {
    if (flatLines[i].type !== 'equal') {
      changedIndices.push(i);
    }
  }

  if (changedIndices.length === 0) {
    return [];
  }

  // Build context windows: for each changed index, mark [i - ctx, i + ctx] as included
  const included = new Uint8Array(flatLines.length);
  for (const ci of changedIndices) {
    const start = Math.max(0, ci - ctx);
    const end = Math.min(flatLines.length - 1, ci + ctx);
    for (let i = start; i <= end; i++) {
      included[i] = 1;
    }
  }

  // Group included indices into contiguous hunks
  const hunks: DiffHunk[] = [];
  let i = 0;
  while (i < flatLines.length) {
    if (!included[i]) {
      i++;
      continue;
    }

    // Start of a hunk
    const hunkLines: DiffLine[] = [];
    while (i < flatLines.length && included[i]) {
      hunkLines.push(flatLines[i]);
      i++;
    }

    // Compute hunk header
    let oldStart = 1;
    let oldCount = 0;
    let newStart = 1;
    let newCount = 0;

    let oldStartSet = false;
    let newStartSet = false;

    for (const dl of hunkLines) {
      if (dl.type === 'equal' || dl.type === 'delete') {
        if (!oldStartSet) {
          oldStart = dl.oldLineNo!;
          oldStartSet = true;
        }
        oldCount++;
      }
      if (dl.type === 'equal' || dl.type === 'insert') {
        if (!newStartSet) {
          newStart = dl.newLineNo!;
          newStartSet = true;
        }
        newCount++;
      }
    }

    if (!oldStartSet) {
      // pure insertion hunk - find the old line number context
      // oldStart should be line before insertion
      const firstNew = hunkLines.find(l => l.newLineNo !== undefined)?.newLineNo ?? 1;
      oldStart = firstNew;
      oldCount = 0;
    }
    if (!newStartSet) {
      // pure deletion hunk
      const firstOld = hunkLines.find(l => l.oldLineNo !== undefined)?.oldLineNo ?? 1;
      newStart = firstOld;
      newCount = 0;
    }

    hunks.push({ oldStart, oldCount, newStart, newCount, lines: hunkLines });
  }

  return hunks;
}

function computeEditScript(
  oldLines: string[],
  newLines: string[]
): Array<{ type: 'equal' | 'insert' | 'delete'; oldIdx?: number; newIdx?: number }> {
  const N = oldLines.length;
  const M = newLines.length;

  if (N === 0 && M === 0) return [];
  if (N === 0) {
    return newLines.map((_, i) => ({ type: 'insert' as const, newIdx: i }));
  }
  if (M === 0) {
    return oldLines.map((_, i) => ({ type: 'delete' as const, oldIdx: i }));
  }

  const MAX = N + M;
  // V array indexed by k, offset by MAX to handle negatives
  const V = new Int32Array(2 * MAX + 2).fill(-1);
  const offset = MAX;
  V[offset + 1] = 0;

  const trace: Int32Array[] = [];

  let found = false;
  let finalD = 0;

  outer:
  for (let d = 0; d <= MAX; d++) {
    trace.push(new Int32Array(V));
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      const km1 = V[offset + k - 1];
      const kp1 = V[offset + k + 1];

      if (k === -d || (k !== d && km1 < kp1)) {
        x = kp1;
      } else {
        x = km1 + 1;
      }

      let y = x - k;

      while (x < N && y < M && oldLines[x] === newLines[y]) {
        x++;
        y++;
      }

      V[offset + k] = x;

      if (x >= N && y >= M) {
        found = true;
        finalD = d;
        break outer;
      }
    }
  }

  if (!found) {
    // Fallback: just delete all old and insert all new
    const r: Array<{ type: 'equal' | 'insert' | 'delete'; oldIdx?: number; newIdx?: number }> = [];
    for (let i = 0; i < N; i++) r.push({ type: 'delete', oldIdx: i });
    for (let i = 0; i < M; i++) r.push({ type: 'insert', newIdx: i });
    return r;
  }

  // Backtrack through trace
  const ops: Array<{ type: 'equal' | 'insert' | 'delete'; oldIdx?: number; newIdx?: number }> = [];
  let x = N;
  let y = M;

  for (let d = finalD; d > 0; d--) {
    const Vd = trace[d];
    const k = x - y;

    const km1 = Vd[offset + k - 1] ?? -1;
    const kp1 = Vd[offset + k + 1] ?? -1;

    let prevK: number;
    if (k === -d || (k !== d && km1 < kp1)) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = Vd[offset + prevK];
    const prevY = prevX - prevK;

    // Diagonal snake (equal lines)
    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', oldIdx: x - 1, newIdx: y - 1 });
      x--;
      y--;
    }

    // The one edit step
    if (prevK === k + 1) {
      // came from k+1 (insert)
      ops.push({ type: 'insert', newIdx: y - 1 });
      y--;
    } else {
      // came from k-1 (delete)
      ops.push({ type: 'delete', oldIdx: x - 1 });
      x--;
    }
  }

  // Remaining diagonal at d=0
  while (x > 0 && y > 0) {
    ops.push({ type: 'equal', oldIdx: x - 1, newIdx: y - 1 });
    x--;
    y--;
  }

  ops.reverse();
  return ops;
}