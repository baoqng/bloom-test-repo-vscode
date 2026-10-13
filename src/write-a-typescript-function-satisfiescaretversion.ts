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

  const v = parseVersionString(version, 'version');

  if (!range.startsWith('^')) {
    throw new SyntaxError(`Malformed range: "${range}" — must start with '^'`);
  }

  const rangeVersionStr = range.slice(1);
  const r = parseVersionString(rangeVersionStr, 'range version');

  if (r.major > 0) {
    // Allow >= r and < (r.major+1).0.0
    const upper: ParsedVersion = { major: r.major + 1, minor: 0, patch: 0 };
    return compareVersions(v, r) >= 0 && compareVersions(v, upper) < 0;
  } else if (r.minor > 0) {
    // Allow >= r and < 0.(r.minor+1).0
    const upper: ParsedVersion = { major: 0, minor: r.minor + 1, patch: 0 };
    return compareVersions(v, r) >= 0 && compareVersions(v, upper) < 0;
  } else {
    // Exact match only: 0.0.PATCH
    return compareVersions(v, r) === 0;
  }
}