// bloom-deps:

function cloneDeep<T>(value: T): T {
	const seen = new WeakMap<object, object>();

	function clone(val: unknown): unknown {
		// Handle primitives
		if (val === null || typeof val === 'undefined') {
			return val;
		}

		const primitiveType = typeof val;
		if (primitiveType === 'string' || primitiveType === 'number' || primitiveType === 'boolean' || primitiveType === 'bigint') {
			return val;
		}

		// Reject symbols and functions
		if (primitiveType === 'symbol') {
			throw new TypeError('Cannot clone symbol');
		}
		if (primitiveType === 'function') {
			throw new TypeError('Cannot clone function');
		}

		// Handle objects
		const obj = val as object;

		// Check for cycles
		if (seen.has(obj)) {
			return seen.get(obj);
		}

		// Handle Date
		if (val instanceof Date) {
			const clonedDate = new Date(val.getTime());
			seen.set(obj, clonedDate);
			return clonedDate;
		}

		// Handle Map
		if (val instanceof Map) {
			const clonedMap = new Map();
			seen.set(obj, clonedMap);
			for (const [key, value] of val.entries()) {
				clonedMap.set(clone(key), clone(value));
			}
			return clonedMap;
		}

		// Handle Set
		if (val instanceof Set) {
			const clonedSet = new Set();
			seen.set(obj, clonedSet);
			for (const value of val.values()) {
				clonedSet.add(clone(value));
			}
			return clonedSet;
		}

		// Handle Array
		if (Array.isArray(val)) {
			const clonedArray = new Array(val.length);
			seen.set(obj, clonedArray);
			for (let i = 0; i < val.length; i++) {
				if (i in val) {
					clonedArray[i] = clone(val[i]);
				} else {
					clonedArray[i] = undefined;
				}
			}
			return clonedArray;
		}

		// Handle plain objects
		const proto = Object.getPrototypeOf(val);
		if (proto !== Object.prototype && proto !== null) {
			throw new TypeError(`Cannot clone instance of ${proto.constructor?.name || 'unknown class'}`);
		}

		// Clone plain object or null-prototype object
		const clonedObj = proto === null ? Object.create(null) : {};
		seen.set(obj, clonedObj);

		for (const key in val) {
			if (Object.prototype.hasOwnProperty.call(val, key)) {
				(clonedObj as Record<string, unknown>)[key] = clone((val as Record<string, unknown>)[key]);
			}
		}

		return clonedObj;
	}

	return clone(value) as T;
}

export { cloneDeep };