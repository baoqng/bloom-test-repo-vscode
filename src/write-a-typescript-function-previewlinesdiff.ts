// bloom-deps:

type DiffOp = 'add' | 'del' | 'ctx';
interface DiffLine { op: DiffOp; text: string; }
interface LineDiff { lines: DiffLine[]; added: number; removed: number; estimated: boolean; }
interface PreviewResult { lines: DiffLine[]; truncatedCount: number; }

function previewLines(diff: LineDiff, maxLines: number = 6): PreviewResult {
    if (typeof maxLines !== 'number' || !Number.isFinite(maxLines)) {
        throw new TypeError(`maxLines must be a finite number, got ${maxLines}`);
    }
    if (maxLines < 0) {
        throw new Error(`maxLines must be non-negative, got ${maxLines}`);
    }

    const changedLines = diff.lines.filter(line => line.op === 'add' || line.op === 'del');
    const total = changedLines.length;
    const cap = Math.floor(maxLines);
    const kept = changedLines.slice(0, cap);
    const truncatedCount = total - kept.length;

    return {
        lines: kept,
        truncatedCount: truncatedCount > 0 ? truncatedCount : 0,
    };
}

export { previewLines, DiffOp, DiffLine, LineDiff, PreviewResult };