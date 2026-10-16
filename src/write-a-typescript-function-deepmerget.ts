// bloom-deps:

function isPlainObject(value: unknown): boolean {
	if (value === null || Array.isArray(value)) {
		return false;
	}
	return typeof value === 'object';
}

function deepClone<T>(value: T): T {
	if (value === null || typeof value !== 'object') {
		return value;
	}
	
	if (Array.isArray(value)) {
		return value.map(item => deepClone(item)) as T;
	}
	
	if (isPlainObject(value)) {
		const cloned: Record<string, unknown> = {};
		for (const key in value as Record<string, unknown>) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				cloned[key] = deepClone((value as Record<string, unknown>)[key]);
			}
		}
		return cloned as T;
	}
	
	return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}
	
	if (a === null || b === null) {
		return a === b;
	}
	
	if (typeof a !== 'object' || typeof b !== 'object') {
		return false;
	}
	
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}
	
	if (Array.isArray(a) || Array.isArray(b)) {
		return false;
	}
	
	const keysA = Object.keys(a as Record<string, unknown>);
	const keysB = Object.keys(b as Record<string, unknown>);
	
	if (keysA.length !== keysB.length) {
		return false;
	}
	
	for (const key of keysA) {
		if (!keysB.includes(key)) {
			return false;
		}
		if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}
	
	return true;
}

function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source?: Partial<T>,
	options?: { arrayMode?: 'replace' | 'concat' | 'union'; overwriteNulls?: boolean }
): T {
	// Validate target
	if (!isPlainObject(target)) {
		throw new TypeError('target must be a plain object');
	}
	
	// Validate source
	if (source !== undefined && !isPlainObject(source)) {
		throw new TypeError('source must be a plain object or undefined');
	}
	
	// If source is undefined, return a deep clone of target
	if (source === undefined) {
		return deepClone(target);
	}
	
	// Start with a deep clone of target
	const result = deepClone(target);
	
	// Merge source into result
	for (const key in source) {
		if (!Object.prototype.hasOwnProperty.call(source, key)) {
			continue;
		}
		
		const sourceValue = source[key];
		const targetValue = result[key];
		
		// If source value is undefined, skip it
		if (sourceValue === undefined) {
			continue;
		}
		
		// If source value is null
		if (sourceValue === null) {
			if (options?.overwriteNulls === true) {
				result[key] = null;
			}
			// Otherwise skip (preserve target key)
			continue;
		}
		
		// Both are plain objects (not arrays, not null) - recurse
		if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
			result[key] = deepMerge(
				targetValue as Record<string, unknown>,
				sourceValue as Record<string, unknown>,
				options
			) as unknown;
			continue;
		}
		
		// Both are arrays - apply arrayMode
		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			const arrayMode = options?.arrayMode ?? 'replace';
			
			if (arrayMode === 'replace') {
				result[key] = deepClone(sourceValue);
			} else if (arrayMode === 'concat') {
				result[key] = [...targetValue, ...sourceValue];
			} else if (arrayMode === 'union') {
				const union = [...targetValue];
				for (const item of sourceValue) {
					const isDuplicate = union.some(existing => deepEqual(existing, item));
					if (!isDuplicate) {
						union.push(item);
					}
				}
				result[key] = union;
			}
			continue;
		}
		
		// Otherwise, source value overwrites target
		result[key] = deepClone(sourceValue);
	}
	
	return result;
}

export { deepMerge };