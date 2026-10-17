export interface PathParts {
  root: string;
  dir: string;
  base: string;
  name: string;
  ext: string;
  isAbsolute: boolean;
  segments: string[];
}

export function splitPath(path: string): PathParts {
  // Validate input
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (path.length === 0 || /^\s+$/.test(path)) {
    throw new TypeError('path cannot be empty or whitespace-only');
  }

  // Detect Windows absolute paths and determine separator behavior
  let root = '';
  let isAbsolute = false;
  let isWindows = false;
  let separator = '/';

  // Check for Windows drive letter: [A-Za-z]:\\ or [A-Za-z]:/
  const driveMatch = path.match(/^[A-Za-z]:[\\/]/);
  if (driveMatch) {
    isWindows = true;
    root = driveMatch[0];
    isAbsolute = true;
    separator = '\\';
    path = path.slice(root.length);
  } else if (path.match(/^\\\\[^\\\/]+[\\\/][^\\\/]+/)) {
    // Windows UNC: \\server\share
    isWindows = true;
    const parts = path.slice(2).split(/[\\\/]/);
    root = '\\\\' + parts[0] + '\\' + parts[1];
    isAbsolute = true;
    separator = '\\';
    path = path.slice(root.length);
  } else if (path.match(/^\/\/[^\\\/]+[\\\/][^\\\/]+/)) {
    // UNC forward slash style: //server/share
    isWindows = true;
    const parts = path.slice(2).split(/[\\\/]/);
    root = '//' + parts[0] + '/' + parts[1];
    isAbsolute = true;
    separator = '/';
    path = path.slice(root.length);
  } else if (path.startsWith('/')) {
    // POSIX absolute
    root = '/';
    isAbsolute = true;
    separator = '/';
    path = path.slice(1);
  } else if (path.includes('\\')) {
    // Mixed or backslash-only non-Windows path: treat backslash as separator
    isWindows = true;
    separator = '\\';
  }

  // Always split on both / and \ if the path contains any backslash
  // This handles mixed separators: e.g. '/foo\bar' should split on both
  const hasMixedSeparators = path.includes('\\');
  const sepRegex = (isWindows || hasMixedSeparators) ? /[\\\/]+/ : /\/+/;
  let rawSegments = path.split(sepRegex).filter((s) => s.length > 0);

  // Remove '.' segments
  const segments = rawSegments.filter((s) => s !== '.');

  // Determine base, name, and ext
  let base = '';
  let name = '';
  let ext = '';

  if (segments.length > 0) {
    base = segments[segments.length - 1];

    // Determine ext and name from base
    const lastDotIndex = base.lastIndexOf('.');
    if (lastDotIndex > 0) {
      // Has extension: not at start, and not the whole string
      ext = base.slice(lastDotIndex);
      name = base.slice(0, lastDotIndex);
    } else if (lastDotIndex === 0) {
      // Hidden file like '.hidden': no extension
      name = base;
      ext = '';
    } else {
      // No dot at all
      name = base;
      ext = '';
    }
  }

  // Determine dir
  let dir = '';
  if (segments.length > 1) {
    const dirSegments = segments.slice(0, -1);
    dir = root + dirSegments.join(separator);
  } else if (root.length > 0) {
    // Root only, no directory segments
    dir = '';
  }

  return {
    root,
    dir,
    base,
    name,
    ext,
    isAbsolute,
    segments,
  };
}