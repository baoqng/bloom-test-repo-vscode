// bloom-deps:

export class ValidationException extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '));
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

type ValidationError = { path: (string | number)[]; message: string };
type ParseResult<T> = { success: true; data: T } | { success: false; errors: ValidationError[] };

interface Schema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): ParseResult<T>;
  refine(check: (value: T) => boolean, message: string): Schema<T>;
  _validate(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] };
}

function makeSchema<T>(
  validateFn: (input: unknown, path: (string | number)[]) => { ok: true; value: T } | { ok: false; errors: ValidationError[] }
): Schema<T> {
  const schema: Schema<T> = {
    _validate: validateFn,
    parse(input: unknown): T {
      const result = validateFn(input, []);
      if (result.ok) return result.value;
      throw new ValidationException(result.errors);
    },
    safeParse(input: unknown): ParseResult<T> {
      try {
        const result = validateFn(input, []);
        if (result.ok) return { success: true, data: result.value };
        return { success: false, errors: result.errors };
      } catch (e) {
        if (e instanceof ValidationException) {
          return { success: false, errors: e.errors };
        }
        return { success: false, errors: [{ path: [], message: String(e) }] };
      }
    },
    refine(check: (value: T) => boolean, message: string): Schema<T> {
      return makeSchema<T>((input, path) => {
        const result = validateFn(input, path);
        if (!result.ok) return result;
        if (!check(result.value)) {
          return { ok: false, errors: [{ path, message }] };
        }
        return result;
      });
    }
  };
  return schema;
}

function string(options?: { min?: number; max?: number; pattern?: RegExp; trim?: boolean }): Schema<string> {
  return makeSchema<string>((input, path) => {
    if (input === null || input === undefined || typeof input !== 'string') {
      return { ok: false, errors: [{ path, message: 'Expected string' }] };
    }
    let value = input;
    if (options?.trim) {
      value = value.trim();
    }
    if (options?.min !== undefined && value.length < options.min) {
      return { ok: false, errors: [{ path, message: `String must be at least ${options.min} characters` }] };
    }
    if (options?.max !== undefined && value.length > options.max) {
      return { ok: false, errors: [{ path, message: `String must be at most ${options.max} characters` }] };
    }
    if (options?.pattern !== undefined && !options.pattern.test(value)) {
      return { ok: false, errors: [{ path, message: `String does not match pattern` }] };
    }
    return { ok: true, value };
  });
}

function number(options?: { min?: number; max?: number; integer?: boolean; finite?: boolean }): Schema<number> {
  return makeSchema<number>((input, path) => {
    if (typeof input !== 'number' || Number.isNaN(input)) {
      return { ok: false, errors: [{ path, message: 'Expected number' }] };
    }
    if (options?.finite && !Number.isFinite(input)) {
      return { ok: false, errors: [{ path, message: 'Expected finite number' }] };
    }
    if (options?.integer && !Number.isInteger(input)) {
      return { ok: false, errors: [{ path, message: 'Expected integer' }] };
    }
    if (options?.min !== undefined && input < options.min) {
      return { ok: false, errors: [{ path, message: `Number must be at least ${options.min}` }] };
    }
    if (options?.max !== undefined && input > options.max) {
      return { ok: false, errors: [{ path, message: `Number must be at most ${options.max}` }] };
    }
    return { ok: true, value: input };
  });
}

function boolean(): Schema<boolean> {
  return makeSchema<boolean>((input, path) => {
    if (typeof input !== 'boolean') {
      return { ok: false, errors: [{ path, message: 'Expected boolean' }] };
    }
    return { ok: true, value: input };
  });
}

function literal<T extends string | number | boolean>(value: T): Schema<T> {
  return makeSchema<T>((input, path) => {
    if (input !== value) {
      return { ok: false, errors: [{ path, message: `Expected literal ${JSON.stringify(value)}` }] };
    }
    return { ok: true, value: input as T };
  });
}

function array<T>(item: Schema<T>, options?: { min?: number; max?: number }): Schema<T[]> {
  return makeSchema<T[]>((input, path) => {
    if (!Array.isArray(input)) {
      return { ok: false, errors: [{ path, message: 'Expected array' }] };
    }
    if (options?.min !== undefined && input.length < options.min) {
      return { ok: false, errors: [{ path, message: `Array must have at least ${options.min} items` }] };
    }
    if (options?.max !== undefined && input.length > options.max) {
      return { ok: false, errors: [{ path, message: `Array must have at most ${options.max} items` }] };
    }
    const result: T[] = [];
    const errors: ValidationError[] = [];
    for (let i = 0; i < input.length; i++) {
      const itemResult = item._validate(input[i], [...path, i]);
      if (itemResult.ok) {
        result.push(itemResult.value);
      } else {
        errors.push(...itemResult.errors);
      }
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }
    return { ok: true, value: result };
  });
}

type InferShape<T extends Record<string, Schema<unknown>>> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

function object<T extends Record<string, Schema<unknown>>>(shape: T): Schema<InferShape<T>> {
  return makeSchema<InferShape<T>>((input, path) => {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return { ok: false, errors: [{ path, message: 'Expected object' }] };
    }
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];
    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      const fieldValue = Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
      const fieldResult = fieldSchema._validate(fieldValue, [...path, key]);
      if (fieldResult.ok) {
        result[key] = fieldResult.value;
      } else {
        errors.push(...fieldResult.errors);
      }
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }
    return { ok: true, value: result as InferShape<T> };
  });
}

function union<T extends Schema<unknown>[]>(...schemas: T): Schema<T[number] extends Schema<infer U> ? U : never> {
  type Out = T[number] extends Schema<infer U> ? U : never;
  return makeSchema<Out>((input, path) => {
    let lastErrors: ValidationError[] = [];
    for (const schema of schemas) {
      const result = schema._validate(input, path);
      if (result.ok) {
        return { ok: true, value: result.value as Out };
      }
      lastErrors = result.errors;
    }
    return { ok: false, errors: lastErrors };
  });
}

function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return makeSchema<T | undefined>((input, path) => {
    if (input === undefined) {
      return { ok: true, value: undefined };
    }
    return schema._validate(input, path) as { ok: true; value: T | undefined } | { ok: false; errors: ValidationError[] };
  });
}

function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return makeSchema<T | null>((input, path) => {
    if (input === null) {
      return { ok: true, value: null };
    }
    return schema._validate(input, path) as { ok: true; value: T | null } | { ok: false; errors: ValidationError[] };
  });
}

function enumSchema<T extends string>(...values: T[]): Schema<T> {
  return makeSchema<T>((input, path) => {
    if (typeof input !== 'string' || !(values as string[]).includes(input)) {
      return { ok: false, errors: [{ path, message: `Expected one of: ${values.map(v => JSON.stringify(v)).join(', ')}` }] };
    }
    return { ok: true, value: input as T };
  });
}

export const z = {
  string,
  number,
  boolean,
  literal,
  array,
  object,
  union,
  optional,
  nullable,
  enum: enumSchema,
};