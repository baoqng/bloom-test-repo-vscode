// bloom-deps:

function isJsonCompatible(value: unknown): boolean {
	if (value === null) return true;
	const type = typeof value;
	if (type === 'boolean' || type === 'string') return true;
	if (type === 'number') {
		return Number.isFinite(value);
	}
	if (type === 'object') {
		if (Array.isArray(value)) {
			return value.every(isJsonCompatible);
		}
		const proto = Object.getPrototypeOf(value);
		if (proto === null || proto === Object.prototype) {
			return Object.values(value).every(isJsonCompatible);
		}
		return false;
	}
	return false;
}

function isPlainObject(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) return false;
	if (Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === null || proto === Object.prototype;
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a === null || b === null) return a === b;
	if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'string') {
		return a === b;
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, i) => deepEqual(item, b[i]));
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const aKeys = Object.keys(a as Record<string, unknown>);
		const bKeys = Object.keys(b as Record<string, unknown>);
		if (aKeys.length !== bKeys.length) return false;
		const aObj = a as Record<string, unknown>;
		const bObj = b as Record<string, unknown>;
		return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
	}
	return false;
}

function escapePath(key: string): string {
	return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

interface DiffOp {
	op: 'add' | 'remove' | 'replace';
	path: string;
	value?: unknown;
}

function diff(before: unknown, after: unknown): DiffOp[] {
	if (!isJsonCompatible(before)) {
		throw new TypeError('before is not JSON-compatible');
	}
	if (!isJsonCompatible(after)) {
		throw new TypeError('after is not JSON-compatible');
	}

	const ops: DiffOp[] = [];
	diffRecursive(before, after, '', ops);
	return ops;
}

function diffRecursive(before: unknown, after: unknown, path: string, ops: DiffOp[]): void {
	if (deepEqual(before, after)) {
		return;
	}

	if (isPlainObject(before) && isPlainObject(after)) {
		const beforeObj = before as Record<string, unknown>;
		const afterObj = after as Record<string, unknown>;

		const beforeKeys = new Set(Object.keys(beforeObj));
		const afterKeys = new Set(Object.keys(afterObj));

		const allKeys = new Set([...beforeKeys, ...afterKeys]);
		const sortedKeys = Array.from(allKeys).sort();

		for (const key of sortedKeys) {
			const keyPath = path === '' ? `/${escapePath(key)}` : `${path}/${escapePath(key)}`;

			if (afterKeys.has(key) && !beforeKeys.has(key)) {
				ops.push({
					op: 'add',
					path: keyPath,
					value: afterObj[key],
				});
			} else if (beforeKeys.has(key) && !afterKeys.has(key)) {
				ops.push({
					op: 'remove',
					path: keyPath,
				});
			} else {
				diffRecursive(beforeObj[key], afterObj[key], keyPath, ops);
			}
		}
	} else {
		ops.push({
			op: 'replace',
			path: path,
			value: after,
		});
	}
}

export { diff };