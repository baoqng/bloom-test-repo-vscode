// bloom-deps:

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
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }
  if (path.trim() === '') {
    throw new TypeError('path must not be empty or whitespace-only');
  }

  // Determine if we need to treat backslash as separator
  // Windows absolute: starts with drive letter + \\ or / OR UNC
  const windowsDriveAbsolute = /^[A-Za-z]:[\\\/]/.test(path);
  const windowsUncAbsolute = /^(\\\\|\/\/)/.test(path);
  const posixAbsolute = path.startsWith('/');

  const hasBackslash = path.includes('\\');
  const treatBackslashAsSep = windowsDriveAbsolute || windowsUncAbsolute || hasBackslash;

  let root = '';
  let isAbsolute = false;
  let rest = path;

  if (windowsUncAbsolute) {
    // UNC: \\server\share or //server/share
    // Normalize the prefix to use consistent separator for parsing
    const normalized = path.replace(/\\/g, '/');
    // After // we need server/share
    const afterSlashes = normalized.slice(2);
    const parts = afterSlashes.split('/').filter(p => p.length > 0);
    if (parts.length >= 2) {
      // root is \\server\share\ (using original separator style)
      const sep = path.startsWith('\\\\') ? '\\' : '/';
      root = sep + sep + parts[0] + sep + parts[1] + sep;
      isAbsolute = true;
      // rest is everything after the UNC root
      // Find where server\share ends in the original path
      const uncRootPattern = treatBackslashAsSep
        ? new RegExp('^[\\\\\/]{2}[^\\\\\/]+[\\\\\/][^\\\\\/]+[\\\\\/]?')
        : new RegExp('^\/\/[^\/]+\/[^\/]+\/?');
      const match = path.match(uncRootPattern);
      rest = match ? path.slice(match[0].length) : '';
    } else if (parts.length === 1) {
      const sep = path.startsWith('\\\\') ? '\\' : '/';
      root = sep + sep + parts[0] + sep;
      isAbsolute = true;
      const uncRootPattern = /^[\\\/]{2}[^\\\/]+[\\\/]?/;
      const match = path.match(uncRootPattern);
      rest = match ? path.slice(match[0].length) : '';
    } else {
      root = path.startsWith('\\\\') ? '\\\\' : '//';
      isAbsolute = true;
      rest = '';
    }
  } else if (windowsDriveAbsolute) {
    // Drive letter: C:\ or C:/
    const driveLetter = path[0].toUpperCase();
    const sep = path[2] === '\\' ? '\\' : '/';
    root = driveLetter + ':' + sep;
    isAbsolute = true;
    rest = path.slice(3);
  } else if (posixAbsolute) {
    root = '/';
    isAbsolute = true;
    rest = path.slice(1);
  } else {
    root = '';
    isAbsolute = false;
    rest = path;
  }

  // Determine the separator for splitting the rest
  // Build a regex to split on separators
  const sepRegex = treatBackslashAsSep ? /[\/\\]+/ : /\/+/;

  // Split rest into raw segments
  const rawSegments = rest.split(sepRegex).filter(s => s.length > 0);

  // Remove '.' segments but preserve '..' segments
  const segments = rawSegments.filter(s => s !== '.');

  // Determine separator character for dir construction
  // Use backslash if windows, forward slash otherwise
  const dirSep = (windowsDriveAbsolute || windowsUncAbsolute) ? '\\' : '/';
  // Actually for dir, we should use forward slash for posix, backslash for windows
  // But let's use forward slash as the normalized separator for non-UNC non-drive paths
  // For consistency: use the detected separator
  const outputSep = (windowsDriveAbsolute || windowsUncAbsolute) ? '\\' : '/';

  let base = '';
  let dir = '';
  let name = '';
  let ext = '';

  if (segments.length === 0) {
    // Root-only path
    base = '';
    dir = '';
    name = '';
    ext = '';
  } else {
    base = segments[segments.length - 1];

    if (segments.length === 1) {
      // Single segment, dir is empty (no dir segments beyond root)
      dir = root ? root.replace(/[\\\/]$/, '') : '';
      // If root-only with one segment: dir = root without trailing sep? 
      // Per spec: dir = join root + segments excluding last with separator
      // segments excluding last = [] so dir = root (but no trailing sep per "no trailing separator")
      // Let's re-read: "dir: directory part, no trailing separator"
      // If root='/' and segments=['file'], dir should be '/'? 
      // Actually standard path.parse behavior: dir='/' for '/file'
      // and dir='' for 'file'
      if (root) {
        dir = root.replace(/[\\\/]+$/, '') || outputSep;
        // e.g. root='/' -> dir='/' (we restore one slash since stripping all gives '')
        if (dir === '') dir = outputSep;
      } else {
        dir = '';
      }
    } else {
      // Multiple segments
      const dirSegments = segments.slice(0, segments.length - 1);
      if (root) {
        const rootNoTrail = root.replace(/[\\\/]+$/, '');
        dir = rootNoTrail + outputSep + dirSegments.join(outputSep);
      } else {
        dir = dirSegments.join(outputSep);
      }
    }

    // Compute name and ext from base
    const dotIndex = base.lastIndexOf('.');
    if (dotIndex <= 0) {
      // No dot, or dot is first character (.hidden)
      name = base;
      ext = '';
    } else {
      ext = base.slice(dotIndex);
      name = base.slice(0, dotIndex);
    }
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