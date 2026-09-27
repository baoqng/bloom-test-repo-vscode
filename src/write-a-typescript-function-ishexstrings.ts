// bloom-deps:

export function isHexString(s: unknown): boolean {
	if (typeof s !== 'string') {
		return false;
	}
	if (s.length === 0) {
		return false;
	}
	return /^[0-9a-fA-F]+$/.test(s);
}