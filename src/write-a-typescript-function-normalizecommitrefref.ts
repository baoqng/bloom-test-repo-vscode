// bloom-deps:

export function normalizeCommitRef(ref: string): string {
	if (typeof ref !== 'string') {
		throw new TypeError(`Invalid commit ref: ${ref}`);
	}

	if (ref.length === 0 || ref.length < 7 || ref.length > 40) {
		throw new TypeError(`Invalid commit ref: ${ref}`);
	}

	if (!/^[0-9a-fA-F]+$/.test(ref)) {
		throw new TypeError(`Invalid commit ref: ${ref}`);
	}

	return ref.toLowerCase();
}