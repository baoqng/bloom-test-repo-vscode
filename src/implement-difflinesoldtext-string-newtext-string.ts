// bloom-deps:

type DiffLine = {
  type: 'equal' | 'insert' | 'delete';
  line: string;
  oldLineNo?: number;
  newLineNo?: number;
};

type DiffHunk = {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
};

function splitLines(text: string): string[] {
  if (text.length === 0) {
    return [];
  }
  const lines = text.split('\n');
  if (text.endsWith('\n')) {
    return lines;
  }
  return lines;
}

function computeLCS(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function backtrackLCS(
  oldLines: string[],
  newLines: string[],
  dp: number[][]
): { type: 'equal' | 'insert' | 'delete'; oldIdx: number; newIdx: number }[] {
  const operations: { type: 'equal' | 'insert' | 'delete'; oldIdx: number; newIdx: number }[] = [];

  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      operations.unshift({ type: 'equal', oldIdx: i - 1, newIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      operations.unshift({ type: 'insert', oldIdx: -1, newIdx: j - 1 });
      j--;
    } else if (i > 0) {
      operations.unshift({ type: 'delete', oldIdx: i - 1, newIdx: -1 });
      i--;
    }
  }

  return operations;
}

function buildDiffLines(
  oldLines: string[],
  newLines: string[],
  operations: { type: 'equal' | 'insert' | 'delete'; oldIdx: number; newIdx: number }[]
): DiffLine[] {
  const diffLines: DiffLine[] = [];
  let oldLineNo = 1;
  let newLineNo = 1;

  for (const op of operations) {
    if (op.type === 'equal') {
      diffLines.push({
        type: 'equal',
        line: oldLines[op.oldIdx],
        oldLineNo,
        newLineNo,
      });
      oldLineNo++;
      newLineNo++;
    } else if (op.type === 'delete') {
      diffLines.push({
        type: 'delete',
        line: oldLines[op.oldIdx],
        oldLineNo,
      });
      oldLineNo++;
    } else if (op.type === 'insert') {
      diffLines.push({
        type: 'insert',
        line: newLines[op.newIdx],
        newLineNo,
      });
      newLineNo++;
    }
  }

  return diffLines;
}

function groupIntoHunks(
  diffLines: DiffLine[],
  contextLines: number
): DiffHunk[] {
  if (diffLines.length === 0) {
    return [];
  }

  const hunks: DiffHunk[] = [];
  let currentHunk: DiffLine[] | null = null;
  let lastChangeIdx = -1;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];
    const isChange = line.type !== 'equal';

    if (isChange) {
      if (currentHunk === null || i - lastChangeIdx > contextLines) {
        if (currentHunk !== null) {
          hunks.push(createHunk(currentHunk));
        }
        currentHunk = [];

        const startIdx = Math.max(0, i - contextLines);
        for (let j = startIdx; j < i; j++) {
          currentHunk.push(diffLines[j]);
        }
      }

      currentHunk!.push(line);
      lastChangeIdx = i;
    } else {
      if (currentHunk !== null && i - lastChangeIdx < contextLines) {
        currentHunk.push(line);
      } else if (currentHunk !== null && i - lastChangeIdx === contextLines) {
        currentHunk.push(line);
        lastChangeIdx = i;
      }
    }
  }

  if (currentHunk !== null) {
    hunks.push(createHunk(currentHunk));
  }

  return hunks;
}

function createHunk(lines: DiffLine[]): DiffHunk {
  let oldStart: number | null = null;
  let newStart: number | null = null;
  let oldCount = 0;
  let newCount = 0;

  for (const line of lines) {
    if (line.type === 'delete' || line.type === 'equal') {
      if (line.oldLineNo !== undefined) {
        if (oldStart === null) {
          oldStart = line.oldLineNo;
        }
        oldCount = line.oldLineNo - oldStart + 1;
      }
    }
    if (line.type === 'insert' || line.type === 'equal') {
      if (line.newLineNo !== undefined) {
        if (newStart === null) {
          newStart = line.newLineNo;
        }
        newCount = line.newLineNo - newStart + 1;
      }
    }
  }

  return {
    oldStart: oldStart || 1,
    oldCount,
    newStart: newStart || 1,
    newCount,
    lines,
  };
}

export function diffLines(
  oldText: string,
  newText: string,
  contextLines: number = 3
): DiffHunk[] {
  if (typeof oldText !== 'string') {
    throw new TypeError('oldText must be a string');
  }
  if (typeof newText !== 'string') {
    throw new TypeError('newText must be a string');
  }
  if (contextLines < 0) {
    throw new RangeError('contextLines must be non-negative');
  }

  if (oldText === newText) {
    return [];
  }

  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);

  const dp = computeLCS(oldLines, newLines);
  const operations = backtrackLCS(oldLines, newLines, dp);
  const diffLines = buildDiffLines(oldLines, newLines, operations);
  const hunks = groupIntoHunks(diffLines, contextLines);

  return hunks;
}