// bloom-deps:

function deepEqual(a: unknown, b: unknown): boolean {
	const visited = new WeakSet<object>();

	function compare(x: unknown, y: unknown): boolean {
		// Handle NaN equality
		if (typeof x === 'number' && typeof y === 'number') {
			if (Number.isNaN(x) && Number.isNaN(y)) {
				return true;
			}
			// Handle +0 and -0 equality
			if (x === 0 && y === 0) {
				return true;
			}
			// Use Object.is for other numeric comparisons
			return Object.is(x, y);
		}

		// Handle primitives with Object.is semantics
		if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) {
			return Object.is(x, y);
		}

		// Cyclic reference detection
		if (visited.has(x as object)) {
			return visited.has(y as object);
		}

		// Check prototype equality
		if (Object.getPrototypeOf(x) !== Object.getPrototypeOf(y)) {
			return false;
		}

		// Handle Date objects
		if (x instanceof Date && y instanceof Date) {
			return x.getTime() === y.getTime();
		}

		// Handle arrays
		if (Array.isArray(x) && Array.isArray(y)) {
			if (x.length !== y.length) {
				return false;
			}
			visited.add(x);
			for (let i = 0; i < x.length; i++) {
				if (!compare(x[i], y[i])) {
					visited.delete(x);
					return false;
				}
			}
			visited.delete(x);
			return true;
		}

		// Array vs non-array object
		if (Array.isArray(x) !== Array.isArray(y)) {
			return false;
		}

		// Handle Map objects
		if (x instanceof Map && y instanceof Map) {
			if (x.size !== y.size) {
				return false;
			}
			visited.add(x);
			for (const [key, value] of x) {
				if (!y.has(key)) {
					visited.delete(x);
					return false;
				}
				if (!compare(value, y.get(key))) {
					visited.delete(x);
					return false;
				}
			}
			visited.delete(x);
			return true;
		}

		// Handle Set objects
		if (x instanceof Set && y instanceof Set) {
			if (x.size !== y.size) {
				return false;
			}
			visited.add(x);
			for (const value of x) {
				let found = false;
				for (const yValue of y) {
					if (compare(value, yValue)) {
						found = true;
						break;
					}
				}
				if (!found) {
					visited.delete(x);
					return false;
				}
			}
			visited.delete(x);
			return true;
		}

		// Handle plain objects
		const keysX = Object.keys(x as Record<string, unknown>);
		const keysY = Object.keys(y as Record<string, unknown>);

		if (keysX.length !== keysY.length) {
			return false;
		}

		const keySet = new Set(keysY);
		for (const key of keysX) {
			if (!keySet.has(key)) {
				return false;
			}
		}

		visited.add(x as object);
		for (const key of keysX) {
			if (!compare((x as Record<string, unknown>)[key], (y as Record<string, unknown>)[key])) {
				visited.delete(x as object);
				return false;
			}
		}
		visited.delete(x as object);
		return true;
	}

	return compare(a, b);
}

export { deepEqual };