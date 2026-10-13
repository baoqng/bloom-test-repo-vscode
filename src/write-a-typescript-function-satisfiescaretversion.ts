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
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
    patch: parseInt(parts[2], 10),
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
    throw new SyntaxError(`Malformed range: "${range}" — must start with '^'`);
  }

  const rangeVersionStr = range.slice(1);
  const v = parseVersionString(version, 'version');
  const r = parseVersionString(rangeVersionStr, 'range');

  const cmp = compareVersions(v, r);

  if (r.major > 0) {
    // version >= range and < (r.major+1).0.0
    if (cmp < 0) return false;
    if (v.major >= r.major + 1) return false;
    return true;
  } else if (r.minor > 0) {
    // r.major === 0, r.minor > 0: version >= range and < 0.(r.minor+1).0
    if (cmp < 0) return false;
    if (v.major > 0) return false;
    if (v.minor >= r.minor + 1) return false;
    return true;
  } else {
    // r.major === 0, r.minor === 0: exact match only
    return cmp === 0;
  }
}