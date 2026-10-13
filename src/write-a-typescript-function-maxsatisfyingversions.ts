// bloom-deps:

function maxSatisfying(versions: unknown, range: unknown): string | null {
	// Type validation
	if (!Array.isArray(versions)) {
		throw new TypeError('versions must be an array');
	}

	if (typeof range !== 'string') {
		throw new TypeError('range must be a string');
	}

	// Validate versions array contains only strings
	for (const v of versions) {
		if (typeof v !== 'string') {
			throw new TypeError('versions must be an array of strings');
		}
	}

	// Validate each version string format: MAJOR.MINOR.PATCH (non-negative integers, no leading zeros)
	const versionRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
	for (const v of versions) {
		if (!versionRegex.test(v)) {
			throw new SyntaxError(`invalid version: ${v}`);
		}
	}

	// Parse and validate range
	if (range.length === 0) {
		throw new SyntaxError('range cannot be empty');
	}

	const comparators = range.split(' ').filter(c => c.length > 0);
	if (comparators.length === 0) {
		throw new SyntaxError('range cannot be empty');
	}

	const parsedComparators: Array<{ operator: string; major: number; minor: number; patch: number }> = [];

	for (const comp of comparators) {
		let operator = '';
		let versionPart = '';

		if (comp.startsWith('>=')) {
			operator = '>=';
			versionPart = comp.slice(2);
		} else if (comp.startsWith('<=')) {
			operator = '<=';
			versionPart = comp.slice(2);
		} else if (comp.startsWith('>')) {
			operator = '>';
			versionPart = comp.slice(1);
		} else if (comp.startsWith('<')) {
			operator = '<';
			versionPart = comp.slice(1);
		} else if (comp.startsWith('=')) {
			operator = '=';
			versionPart = comp.slice(1);
		} else {
			throw new SyntaxError(`malformed comparator: ${comp}`);
		}

		if (!versionRegex.test(versionPart)) {
			throw new SyntaxError(`malformed comparator: ${comp}`);
		}

		const parts = versionPart.split('.');
		const major = parseInt(parts[0], 10);
		const minor = parseInt(parts[1], 10);
		const patch = parseInt(parts[2], 10);

		parsedComparators.push({ operator, major, minor, patch });
	}

	// Parse versions into comparable format
	const parsedVersions = versions.map(v => {
		const parts = v.split('.');
		return {
			original: v,
			major: parseInt(parts[0], 10),
			minor: parseInt(parts[1], 10),
			patch: parseInt(parts[2], 10),
		};
	});

	// Filter versions that satisfy all comparators
	const satisfying = parsedVersions.filter(v => {
		return parsedComparators.every(comp => {
			const cmp = compareVersions(v.major, v.minor, v.patch, comp.major, comp.minor, comp.patch);
			switch (comp.operator) {
				case '>=':
					return cmp >= 0;
				case '<=':
					return cmp <= 0;
				case '>':
					return cmp > 0;
				case '<':
					return cmp < 0;
				case '=':
					return cmp === 0;
				default:
					return false;
			}
		});
	});

	if (satisfying.length === 0) {
		return null;
	}

	// Remove duplicates while preserving first occurrence order
	const seen = new Set<string>();
	const unique = satisfying.filter(v => {
		if (seen.has(v.original)) {
			return false;
		}
		seen.add(v.original);
		return true;
	});

	// Find the highest version
	let highest = unique[0];
	for (let i = 1; i < unique.length; i++) {
		const cmp = compareVersions(
			unique[i].major,
			unique[i].minor,
			unique[i].patch,
			highest.major,
			highest.minor,
			highest.patch
		);
		if (cmp > 0) {
			highest = unique[i];
		}
	}

	return highest.original;
}

function compareVersions(
	major1: number,
	minor1: number,
	patch1: number,
	major2: number,
	minor2: number,
	patch2: number
): number {
	if (major1 !== major2) {
		return major1 - major2;
	}
	if (minor1 !== minor2) {
		return minor1 - minor2;
	}
	return patch1 - patch2;
}

export { maxSatisfying };