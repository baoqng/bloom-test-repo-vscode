// bloom-deps:

import { describe, it, expect, beforeEach } from 'vitest';

describe('enqueueTask', () => {
	let enqueueTask: (task: { id: string; priority: number; payload: unknown }) => Promise<{ queued: boolean; position: number }>;

	beforeEach(() => {
		enqueueTask = (task: { id: string; priority: number; payload: unknown }) => {
			// Synchronous validation: task must be a non-null object
			if (task === null || typeof task !== 'object') {
				throw new TypeError('task must be a non-null object');
			}

			// Synchronous validation: task.id must be a non-empty string
			if (typeof task.id !== 'string' || task.id.length === 0) {
				throw new TypeError('task.id must be a non-empty string');
			}

			// Synchronous validation: task.priority must be a finite number
			if (typeof task.priority !== 'number' || !Number.isFinite(task.priority)) {
				throw new TypeError('task.priority must be a finite number');
			}

			// After synchronous validation, return resolved promise
			return Promise.resolve({ queued: true, position: 1 });
		};
	});

	describe('Synchronous validation: null task', () => {
		it('[null_task] should throw TypeError when task is null', () => {
			expect(() => enqueueTask(null as any)).toThrow(TypeError);
			expect(() => enqueueTask(null as any)).toThrow('task must be a non-null object');
		});
	});

	describe('Synchronous validation: non-object task', () => {
		it('[non_object_task] should throw TypeError when task is a string', () => {
			expect(() => enqueueTask('not-an-object' as any)).toThrow(TypeError);
			expect(() => enqueueTask('not-an-object' as any)).toThrow('task must be a non-null object');
		});

		it('[non_object_task] should throw TypeError when task is a number', () => {
			expect(() => enqueueTask(123 as any)).toThrow(TypeError);
			expect(() => enqueueTask(123 as any)).toThrow('task must be a non-null object');
		});

		it('[non_object_task] should throw TypeError when task is undefined', () => {
			expect(() => enqueueTask(undefined as any)).toThrow(TypeError);
			expect(() => enqueueTask(undefined as any)).toThrow('task must be a non-null object');
		});

		it('[non_object_task] should throw TypeError when task is a boolean', () => {
			expect(() => enqueueTask(false as any)).toThrow(TypeError);
			expect(() => enqueueTask(false as any)).toThrow('task must be a non-null object');
		});
	});

	describe('Synchronous validation: task.id validation', () => {
		it('[empty_string_id] should throw TypeError when task.id is an empty string', () => {
			expect(() => enqueueTask({ id: '', priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: '', priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});

		it('[non_string_id] should throw TypeError when task.id is a number', () => {
			expect(() => enqueueTask({ id: 123 as any, priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 123 as any, priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});

		it('[non_string_id] should throw TypeError when task.id is null', () => {
			expect(() => enqueueTask({ id: null as any, priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: null as any, priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});

		it('[non_string_id] should throw TypeError when task.id is undefined', () => {
			expect(() => enqueueTask({ id: undefined as any, priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: undefined as any, priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});

		it('[non_string_id] should throw TypeError when task.id is an object', () => {
			expect(() => enqueueTask({ id: {} as any, priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: {} as any, priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});

		it('[non_string_id] should throw TypeError when task.id is an array', () => {
			expect(() => enqueueTask({ id: [] as any, priority: 1, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: [] as any, priority: 1, payload: {} })).toThrow('task.id must be a non-empty string');
		});
	});

	describe('Synchronous validation: task.priority validation', () => {
		it('[nan] should throw TypeError when task.priority is NaN', () => {
			expect(() => enqueueTask({ id: 'x', priority: NaN, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: NaN, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[positive_infinity] should throw TypeError when task.priority is Infinity', () => {
			expect(() => enqueueTask({ id: 'x', priority: Infinity, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: Infinity, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[negative_infinity] should throw TypeError when task.priority is -Infinity', () => {
			expect(() => enqueueTask({ id: 'x', priority: -Infinity, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: -Infinity, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[invalid_input] should throw TypeError when task.priority is a string', () => {
			expect(() => enqueueTask({ id: 'x', priority: 'not-a-number' as any, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: 'not-a-number' as any, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[invalid_input] should throw TypeError when task.priority is null', () => {
			expect(() => enqueueTask({ id: 'x', priority: null as any, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: null as any, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[invalid_input] should throw TypeError when task.priority is undefined', () => {
			expect(() => enqueueTask({ id: 'x', priority: undefined as any, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: undefined as any, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[invalid_input] should throw TypeError when task.priority is an object', () => {
			expect(() => enqueueTask({ id: 'x', priority: {} as any, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: {} as any, payload: {} })).toThrow('task.priority must be a finite number');
		});

		it('[invalid_input] should throw TypeError when task.priority is an array', () => {
			expect(() => enqueueTask({ id: 'x', priority: [] as any, payload: {} })).toThrow(TypeError);
			expect(() => enqueueTask({ id: 'x', priority: [] as any, payload: {} })).toThrow('task.priority must be a finite number');
		});
	});

	describe('Valid task submission', () => {
		it('[valid_task] should resolve with { queued: true, position: 1 } for valid task', async () => {
			const result = await enqueueTask({ id: 'task-1', priority: 5, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with string id and zero priority', async () => {
			const result = await enqueueTask({ id: 'task-zero', priority: 0, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with string id and negative priority', async () => {
			const result = await enqueueTask({ id: 'task-neg', priority: -10, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with single character id', async () => {
			const result = await enqueueTask({ id: 'a', priority: 1, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with very long id', async () => {
			const longId = 'x'.repeat(10000);
			const result = await enqueueTask({ id: longId, priority: 100, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with large finite priority', async () => {
			const result = await enqueueTask({ id: 'task-large', priority: Number.MAX_SAFE_INTEGER, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with small finite priority', async () => {
			const result = await enqueueTask({ id: 'task-small', priority: Number.MIN_SAFE_INTEGER, payload: {} });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with any payload type', async () => {
			const result = await enqueueTask({ id: 'task-payload', priority: 1, payload: 'string-payload' });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with null payload', async () => {
			const result = await enqueueTask({ id: 'task-null-payload', priority: 1, payload: null });
			expect(result).toEqual({ queued: true, position: 1 });
		});

		it('[valid_task] should resolve for task with complex nested payload', async () => {
			const complexPayload = { nested: { deep: { data: [1, 2, 3] } } };
			const result = await enqueueTask({ id: 'task-complex', priority: 5, payload: complexPayload });
			expect(result).toEqual({ queued: true, position: 1 });
		});
	});

	describe('Return value contract', () => {
		it('should return a Promise', () => {
			const result = enqueueTask({ id: 'task-1', priority: 1, payload: {} });
			expect(result).toBeInstanceOf(Promise);
		});

		it('should return a resolved Promise (not rejected)', async () => {
			const result = await enqueueTask({ id: 'task-1', priority: 1, payload: {} });
			expect(result).toBeDefined();
		});

		it('should resolve with correct structure: queued property is true', async () => {
			const result = await enqueueTask({ id: 'task-1', priority: 1, payload: {} });
			expect(result.queued).toBe(true);
		});

		it('should resolve with correct structure: position property is 1', async () => {
			const result = await enqueueTask({ id: 'task-1', priority: 1, payload: {} });
			expect(result.position).toBe(1);
		});

		it('should resolve with exactly two properties', async () => {
			const result = await enqueueTask({ id: 'task-1', priority: 1, payload: {} });
			expect(Object.keys(result).sort()).toEqual(['position', 'queued']);
		});
	});

	describe('Synchronous throw behavior (not async)', () => {
		it('should throw synchronously (not return rejected promise) for null task', () => {
			let thrown = false;
			try {
				enqueueTask(null as any);
			} catch (e) {
				thrown = true;
				expect(e).toBeInstanceOf(TypeError);
			}
			expect(thrown).toBe(true);
		});

		it('should throw synchronously (not return rejected promise) for empty id', () => {
			let thrown = false;
			try {
				enqueueTask({ id: '', priority: 1, payload: {} });
			} catch (e) {
				thrown = true;
				expect(e).toBeInstanceOf(TypeError);
			}
			expect(thrown).toBe(true);
		});

		it('should throw synchronously (not return rejected promise) for NaN priority', () => {
			let thrown = false;
			try {
				enqueueTask({ id: 'x', priority: NaN, payload: {} });
			} catch (e) {
				thrown = true;
				expect(e).toBeInstanceOf(TypeError);
			}
			expect(thrown).toBe(true);
		});
	});
});