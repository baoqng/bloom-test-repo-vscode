// bloom-deps:

type ValidationError = { path: (string | number)[]; message: string };
type ParseResult<T> = { success: true; data: T } | { success: false; errors: ValidationError[] };

export class ValidationException extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    this.name = 'ValidationException';
    this.errors = errors;
  }
}

interface Schema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): ParseResult<T>;
  refine(check: (value: T) => boolean, message: string): Schema<T>;
  _parse(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] };
}

abstract class BaseSchema<T> implements Schema<T> {
  protected refinements: Array<{ check: (value: T) => boolean; message: string }> = [];

  abstract _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] };

  _parse(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] } {
    const result = this._parseInner(input, path);
    if (!result.ok) return result;
    for (const r of this.refinements) {
      if (!r.check(result.value)) {
        return { ok: false, errors: [{ path, message: r.message }] };
      }
    }
    return result;
  }

  parse(input: unknown): T {
    const result = this._parse(input, []);
    if (!result.ok) throw new ValidationException(result.errors);
    return result.value;
  }

  safeParse(input: unknown): ParseResult<T> {
    try {
      const result = this._parse(input, []);
      if (!result.ok) return { success: false, errors: result.errors };
      return { success: true, data: result.value };
    } catch {
      return { success: false, errors: [{ path: [], message: 'Unknown error' }] };
    }
  }

  refine(check: (value: T) => boolean, message: string): Schema<T> {
    const clone = this._clone();
    clone.refinements = [...this.refinements, { check, message }];
    return clone;
  }

  protected abstract _clone(): BaseSchema<T>;
}

class StringSchema extends BaseSchema<string> {
  constructor(private options: { min?: number; max?: number; pattern?: RegExp; trim?: boolean } = {}) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: string } | { ok: false; errors: ValidationError[] } {
    if (typeof input !== 'string') {
      return { ok: false, errors: [{ path, message: 'Expected string' }] };
    }
    const value = this.options.trim ? input.trim() : input;
    if (this.options.min !== undefined && value.length < this.options.min) {
      return { ok: false, errors: [{ path, message: `String must be at least ${this.options.min} characters` }] };
    }
    if (this.options.max !== undefined && value.length > this.options.max) {
      return { ok: false, errors: [{ path, message: `String must be at most ${this.options.max} characters` }] };
    }
    if (this.options.pattern !== undefined && !this.options.pattern.test(value)) {
      return { ok: false, errors: [{ path, message: `String does not match pattern` }] };
    }
    return { ok: true, value };
  }

  protected _clone(): StringSchema {
    const c = new StringSchema(this.options);
    c.refinements = [...this.refinements];
    return c;
  }
}

class NumberSchema extends BaseSchema<number> {
  constructor(private options: { min?: number; max?: number; integer?: boolean; finite?: boolean } = {}) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: number } | { ok: false; errors: ValidationError[] } {
    if (typeof input !== 'number') {
      return { ok: false, errors: [{ path, message: 'Expected number' }] };
    }
    if (this.options.finite && !isFinite(input)) {
      return { ok: false, errors: [{ path, message: 'Expected finite number' }] };
    }
    if (this.options.integer && !Number.isInteger(input)) {
      return { ok: false, errors: [{ path, message: 'Expected integer' }] };
    }
    if (this.options.min !== undefined && input < this.options.min) {
      return { ok: false, errors: [{ path, message: `Number must be at least ${this.options.min}` }] };
    }
    if (this.options.max !== undefined && input > this.options.max) {
      return { ok: false, errors: [{ path, message: `Number must be at most ${this.options.max}` }] };
    }
    return { ok: true, value: input };
  }

  protected _clone(): NumberSchema {
    const c = new NumberSchema(this.options);
    c.refinements = [...this.refinements];
    return c;
  }
}

class BooleanSchema extends BaseSchema<boolean> {
  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: boolean } | { ok: false; errors: ValidationError[] } {
    if (typeof input !== 'boolean') {
      return { ok: false, errors: [{ path, message: 'Expected boolean' }] };
    }
    return { ok: true, value: input };
  }

  protected _clone(): BooleanSchema {
    const c = new BooleanSchema();
    c.refinements = [...this.refinements];
    return c;
  }
}

class LiteralSchema<T extends string | number | boolean> extends BaseSchema<T> {
  constructor(private value: T) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] } {
    if (input !== this.value) {
      return { ok: false, errors: [{ path, message: `Expected literal ${JSON.stringify(this.value)}` }] };
    }
    return { ok: true, value: input as T };
  }

  protected _clone(): LiteralSchema<T> {
    const c = new LiteralSchema<T>(this.value);
    c.refinements = [...this.refinements];
    return c;
  }
}

class ArraySchema<T> extends BaseSchema<T[]> {
  constructor(private item: Schema<T>, private options: { min?: number; max?: number } = {}) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T[] } | { ok: false; errors: ValidationError[] } {
    if (!Array.isArray(input)) {
      return { ok: false, errors: [{ path, message: 'Expected array' }] };
    }
    if (this.options.min !== undefined && input.length < this.options.min) {
      return { ok: false, errors: [{ path, message: `Array must have at least ${this.options.min} items` }] };
    }
    if (this.options.max !== undefined && input.length > this.options.max) {
      return { ok: false, errors: [{ path, message: `Array must have at most ${this.options.max} items` }] };
    }
    const results: T[] = [];
    const errors: ValidationError[] = [];
    for (let i = 0; i < input.length; i++) {
      const r = this.item._parse(input[i], [...path, i]);
      if (!r.ok) {
        errors.push(...r.errors);
      } else {
        results.push(r.value);
      }
    }
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: results };
  }

  protected _clone(): ArraySchema<T> {
    const c = new ArraySchema<T>(this.item, this.options);
    c.refinements = [...this.refinements];
    return c;
  }
}

type ShapeToType<T extends Record<string, Schema<unknown>>> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

class ObjectSchema<T extends Record<string, Schema<unknown>>> extends BaseSchema<ShapeToType<T>> {
  constructor(private shape: T) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: ShapeToType<T> } | { ok: false; errors: ValidationError[] } {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return { ok: false, errors: [{ path, message: 'Expected object' }] };
    }
    const obj = input as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];
    for (const key of Object.keys(this.shape)) {
      const fieldSchema = this.shape[key];
      const fieldValue = Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
      const r = fieldSchema._parse(fieldValue, [...path, key]);
      if (!r.ok) {
        errors.push(...r.errors);
      } else {
        result[key] = r.value;
      }
    }
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: result as ShapeToType<T> };
  }

  protected _clone(): ObjectSchema<T> {
    const c = new ObjectSchema<T>(this.shape);
    c.refinements = [...this.refinements];
    return c;
  }
}

class UnionSchema<T> extends BaseSchema<T> {
  constructor(private schemas: Schema<unknown>[]) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] } {
    let lastErrors: ValidationError[] = [];
    for (const schema of this.schemas) {
      const r = schema._parse(input, path);
      if (r.ok) return { ok: true, value: r.value as T };
      lastErrors = r.errors;
    }
    return { ok: false, errors: lastErrors };
  }

  protected _clone(): UnionSchema<T> {
    const c = new UnionSchema<T>(this.schemas);
    c.refinements = [...this.refinements];
    return c;
  }
}

class OptionalSchema<T> extends BaseSchema<T | undefined> {
  constructor(private schema: Schema<T>) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T | undefined } | { ok: false; errors: ValidationError[] } {
    if (input === undefined) return { ok: true, value: undefined };
    return this.schema._parse(input, path) as { ok: true; value: T | undefined } | { ok: false; errors: ValidationError[] };
  }

  protected _clone(): OptionalSchema<T> {
    const c = new OptionalSchema<T>(this.schema);
    c.refinements = [...this.refinements];
    return c;
  }
}

class NullableSchema<T> extends BaseSchema<T | null> {
  constructor(private schema: Schema<T>) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T | null } | { ok: false; errors: ValidationError[] } {
    if (input === null) return { ok: true, value: null };
    return this.schema._parse(input, path) as { ok: true; value: T | null } | { ok: false; errors: ValidationError[] };
  }

  protected _clone(): NullableSchema<T> {
    const c = new NullableSchema<T>(this.schema);
    c.refinements = [...this.refinements];
    return c;
  }
}

class EnumSchema<T extends string> extends BaseSchema<T> {
  constructor(private values: T[]) {
    super();
  }

  _parseInner(input: unknown, path: (string | number)[]): { ok: true; value: T } | { ok: false; errors: ValidationError[] } {
    if (typeof input !== 'string' || !this.values.includes(input as T)) {
      return { ok: false, errors: [{ path, message: `Expected one of: ${this.values.join(', ')}` }] };
    }
    return { ok: true, value: input as T };
  }

  protected _clone(): EnumSchema<T> {
    const c = new EnumSchema<T>(this.values);
    c.refinements = [...this.refinements];
    return c;
  }
}

function string(options?: { min?: number; max?: number; pattern?: RegExp; trim?: boolean }): Schema<string> {
  return new StringSchema(options);
}

function number(options?: { min?: number; max?: number; integer?: boolean; finite?: boolean }): Schema<number> {
  return new NumberSchema(options);
}

function boolean(): Schema<boolean> {
  return new BooleanSchema();
}

function literal<T extends string | number | boolean>(value: T): Schema<T> {
  return new LiteralSchema(value);
}

function array<T>(item: Schema<T>, options?: { min?: number; max?: number }): Schema<T[]> {
  return new ArraySchema(item, options);
}

function object<T extends Record<string, Schema<unknown>>>(shape: T): Schema<ShapeToType<T>> {
  return new ObjectSchema(shape);
}

function union<T extends Schema<unknown>[]>(...schemas: T): Schema<T[number] extends Schema<infer U> ? U : never> {
  return new UnionSchema(schemas) as Schema<T[number] extends Schema<infer U> ? U : never>;
}

function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return new OptionalSchema(schema);
}

function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return new NullableSchema(schema);
}

function enumSchema<T extends string>(...values: T[]): Schema<T> {
  return new EnumSchema(values);
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