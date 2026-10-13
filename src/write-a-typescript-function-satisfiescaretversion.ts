// bloom-deps:

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseVersionString(s: string, label: string): ParsedVersion {
  if (!VERSION_RE.test(s)) {
    throw new SyntaxError(`Malformed ${label}: "${s}"`);
  }
  const parts = s.split('.');
  return {
    major: Number(parts[0]),
    minor: Number(parts[1]),
    patch: Number(parts[2]),
  };
}

function compareVersions(a: ParsedVersion, b: ParsedVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

export function satisfiesCaret(version: unknown, range: unknown): boolean {
  if (typeof version !== 'string') {
    throw new TypeError(`version must be a string, got ${typeof version}`);
  }
  if (typeof range !== 'string') {
    throw new TypeError(`range must be a string, got ${typeof range}`);
  }

  if (!range.startsWith('^')) {
    throw new SyntaxError(`Malformed range (must start with '^'): "${range}"`);
  }

  const rangeVersionStr = range.slice(1);
  const v = parseVersionString(version, 'version');
  const r = parseVersionString(rangeVersionStr, 'range');

  const cmp = compareVersions(v, r);

  if (r.major > 0) {
    // Allow >= range and < (MAJOR+1).0.0
    if (cmp < 0) return false;
    if (v.major >= r.major + 1) return false;
    return true;
  }

  if (r.minor > 0) {
    // MAJOR=0, MINOR>0: allow >= range and < 0.(MINOR+1).0
    if (cmp < 0) return false;
    if (v.major !== 0) return false;
    if (v.minor >= r.minor + 1) return false;
    return true;
  }

  // MAJOR=0, MINOR=0: exact match only
  return cmp === 0;
}