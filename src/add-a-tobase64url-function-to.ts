/**
 * Converts a standard base64 string to base64url format.
 * Replaces + with -, / with _, and removes = padding.
 *
 * @param base64 - A standard base64 encoded string
 * @returns The base64url encoded string, or empty string for empty input
 * @throws TypeError if the input is not a string
 */
export function toBase64Url(base64: string): string {
	if (typeof base64 !== 'string') {
		throw new TypeError(`Expected a string, but received ${typeof base64}`);
	}

	if (base64 === '') {
		return '';
	}

	return base64
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}