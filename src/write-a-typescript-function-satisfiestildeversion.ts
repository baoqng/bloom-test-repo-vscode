// bloom-deps:

/**
 * Validates that a value is a string, throwing TypeError if not.
 */
function ensureString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
  return value;
}

/**
 * Parses a version string in the format MAJOR.MINOR.PATCH.
 * Throws SyntaxError if the format is invalid.
 */
function parseVersion(versionStr: string): { major: number; minor: number; patch: number } {
  const parts = versionStr.split('.');
  
  if (parts.length !== 3) {
    throw new SyntaxError(`Invalid version format: ${versionStr}`);
  }
  
  const [majorStr, minorStr, patchStr] = parts;
  
  // Check for leading zeros (except for "0" itself) and invalid formats
  if (!isValidNumericComponent(majorStr) || !isValidNumericComponent(minorStr) || !isValidNumericComponent(patchStr)) {
    throw new SyntaxError(`Invalid version format: ${versionStr}`);
  }
  
  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);
  
  return { major, minor, patch };
}

/**
 * Checks if a string component is a valid non-negative integer without leading zeros.
 */
function isValidNumericComponent(component: string): boolean {
  // Must match: optional digits, but not leading zero unless it's just "0"
  // Reject: empty, leading zeros (except standalone "0"), non-digits, negative sign
  if (component.length === 0) {
    return false;
  }
  
  // Check for leading zero (but "0" by itself is valid)
  if (component.length > 1 && component[0] === '0') {
    return false;
  }
  
  // Check that all characters are digits
  for (const char of component) {
    if (!/\d/.test(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Parses a tilde range string in the format ~MAJOR, ~MAJOR.MINOR, or ~MAJOR.MINOR.PATCH.
 * Throws SyntaxError if the format is invalid.
 */
function parseRange(rangeStr: string): { type: 'major' | 'minor' | 'patch'; major: number; minor?: number; patch?: number } {
  if (!rangeStr.startsWith('~')) {
    throw new SyntaxError(`Range must start with ~: ${rangeStr}`);
  }
  
  const versionPart = rangeStr.slice(1);
  const parts = versionPart.split('.');
  
  if (parts.length < 1 || parts.length > 3) {
    throw new SyntaxError(`Invalid range format: ${rangeStr}`);
  }
  
  // Validate each part
  for (const part of parts) {
    if (!isValidNumericComponent(part)) {
      throw new SyntaxError(`Invalid range format: ${rangeStr}`);
    }
  }
  
  if (parts.length === 1) {
    // ~X
    const major = parseInt(parts[0], 10);
    return { type: 'major', major };
  } else if (parts.length === 2) {
    // ~X.Y
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    return { type: 'minor', major, minor };
  } else {
    // ~X.Y.Z
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parseInt(parts[2], 10);
    return { type: 'patch', major, minor, patch };
  }
}

/**
 * Determines if a version satisfies a tilde range.
 * 
 * @param version - Version string in format MAJOR.MINOR.PATCH
 * @param range - Tilde range string (~X, ~X.Y, or ~X.Y.Z)
 * @returns true if version satisfies the range, false otherwise
 * @throws TypeError if version or range is not a string
 * @throws SyntaxError if version or range format is invalid
 */
export function satisfiesTilde(version: unknown, range: unknown): boolean {
  // Validate inputs are strings
  const versionStr = ensureString(version, 'version');
  const rangeStr = ensureString(range, 'range');
  
  // Parse version
  const parsedVersion = parseVersion(versionStr);
  
  // Parse range
  const parsedRange = parseRange(rangeStr);
  
  // Check satisfaction based on range type
  if (parsedRange.type === 'major') {
    // ~X allows >= X.0.0 and < (X+1).0.0
    const lowerOk = parsedVersion.major >= parsedRange.major;
    const upperOk = parsedVersion.major < parsedRange.major + 1;
    return lowerOk && upperOk;
  } else if (parsedRange.type === 'minor') {
    // ~X.Y allows >= X.Y.0 and < X.(Y+1).0
    const lowerMajorOk = parsedVersion.major === parsedRange.major;
    const lowerMinorOk = parsedVersion.minor >= parsedRange.minor!;
    const lowerOk = lowerMajorOk && lowerMinorOk;
    
    const upperMajorOk = parsedVersion.major === parsedRange.major;
    const upperMinorOk = parsedVersion.minor < parsedRange.minor! + 1;
    const upperOk = upperMajorOk && upperMinorOk;
    
    return lowerOk && upperOk;
  } else {
    // ~X.Y.Z allows >= X.Y.Z and < X.(Y+1).0
    const lowerMajorOk = parsedVersion.major === parsedRange.major;
    const lowerMinorOk = parsedVersion.minor === parsedRange.minor!;
    const lowerPatchOk = parsedVersion.patch >= parsedRange.patch!;
    const lowerOk = lowerMajorOk && lowerMinorOk && lowerPatchOk;
    
    const upperMajorOk = parsedVersion.major === parsedRange.major;
    const upperMinorOk = parsedVersion.minor < parsedRange.minor! + 1;
    const upperOk = upperMajorOk && upperMinorOk;
    
    return lowerOk && upperOk;
  }
}