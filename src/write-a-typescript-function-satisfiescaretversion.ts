export function satisfiesCaret(version: unknown, range: unknown): boolean {
	// Type validation
	if (typeof version !== 'string') {
		throw new TypeError('version must be a string');
	}
	if (typeof range !== 'string') {
		throw new TypeError('range must be a string');
	}

	// Parse and validate version
	const versionParts = parseVersion(version);
	if (!versionParts) {
		throw new SyntaxError(`Invalid version: ${version}`);
	}

	// Parse and validate range
	if (!range.startsWith('^')) {
		throw new SyntaxError(`Invalid range: ${range}`);
	}

	const rangeParts = parseVersion(range.slice(1));
	if (!rangeParts) {
		throw new SyntaxError(`Invalid range: ${range}`);
	}

	const [vMajor, vMinor, vPatch] = versionParts;
	const [rMajor, rMinor, rPatch] = rangeParts;

	// Caret semantics
	if (rMajor > 0) {
		// Allow >= range and < next MAJOR
		if (vMajor !== rMajor) {
			return false;
		}
		// vMajor === rMajor
		if (vMinor < rMinor) {
			return false;
		}
		if (vMinor > rMinor) {
			return true;
		}
		// vMinor === rMinor
		return vPatch >= rPatch;
	} else if (rMinor > 0) {
		// Allow >= range and < 0.(MINOR+1).0
		if (vMajor !== 0) {
			return false;
		}
		if (vMinor !== rMinor) {
			return false;
		}
		// vMinor === rMinor
		return vPatch >= rPatch;
	} else {
		// MAJOR and MINOR are both 0: allow only exactly 0.0.PATCH
		return vMajor === 0 && vMinor === 0 && vPatch === rPatch;
	}
}

function parseVersion(versionString: string): [number, number, number] | null {
	// Validate format: MAJOR.MINOR.PATCH
	const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) {
		return null;
	}

	const major = match[1];
	const minor = match[2];
	const patch = match[3];

	// Reject leading zeros (except for "0" itself)
	if ((major.length > 1 && major[0] === '0') ||
		(minor.length > 1 && minor[0] === '0') ||
		(patch.length > 1 && patch[0] === '0')) {
		return null;
	}

	return [parseInt(major, 10), parseInt(minor, 10), parseInt(patch, 10)];
}