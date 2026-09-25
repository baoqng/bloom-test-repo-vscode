// bloom-deps:

export function parseNodeModuleId(id: string): { name: string; version: string } {
	if (typeof id !== 'string') {
		throw new TypeError(`Invalid module id: ${id}`);
	}

	const lastAtIndex = id.lastIndexOf('@');

	if (lastAtIndex === -1) {
		throw new TypeError(`Invalid module id: ${id}`);
	}

	const name = id.slice(0, lastAtIndex);
	const version = id.slice(lastAtIndex + 1);

	if (name.length === 0 || version.length === 0) {
		throw new TypeError(`Invalid module id: ${id}`);
	}

	return { name, version };
}