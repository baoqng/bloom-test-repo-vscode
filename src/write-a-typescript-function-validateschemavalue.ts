// bloom-deps:

type Schema =
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: string }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'array'; items: Schema; minItems?: number; maxItems?: number }
  | { type: 'object'; properties: Record<string, Schema>; required?: string[] };

type ValidationError = { path: string; message: string };

function joinPath(parent: string, child: string): string {
  if (parent === '') {
    return child;
  }
  if (child.startsWith('[')) {
    return `${parent}${child}`;
  }
  return `${parent}.${child}`;
}

export function validateSchema(value: unknown, schema: Schema, path: string = ''): ValidationError[] {
  const errors: ValidationError[] = [];

  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') {
        errors.push({ path, message: `expected string but got ${value === null ? 'null' : typeof value}` });
        return errors;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({ path, message: `does not meet minLength ${schema.minLength}` });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({ path, message: `exceeds maxLength ${schema.maxLength}` });
      }
      if (schema.pattern !== undefined) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(value)) {
          errors.push({ path, message: `does not match pattern ${schema.pattern}` });
        }
      }
      break;
    }

    case 'number': {
      if (typeof value !== 'number') {
        errors.push({ path, message: `expected number but got ${value === null ? 'null' : typeof value}` });
        return errors;
      }
      if (schema.min !== undefined && value < schema.min) {
        errors.push({ path, message: `below minimum ${schema.min}` });
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push({ path, message: `above maximum ${schema.max}` });
      }
      if (schema.integer === true && !Number.isInteger(value)) {
        errors.push({ path, message: `expected integer` });
      }
      break;
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        errors.push({ path, message: `expected boolean but got ${value === null ? 'null' : typeof value}` });
        return errors;
      }
      break;
    }

    case 'null': {
      if (value !== null) {
        errors.push({ path, message: `expected null but got ${typeof value}` });
        return errors;
      }
      break;
    }

    case 'array': {
      if (!Array.isArray(value)) {
        errors.push({ path, message: `expected array but got ${value === null ? 'null' : typeof value}` });
        return errors;
      }
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push({ path, message: `has fewer than minItems ${schema.minItems}` });
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        errors.push({ path, message: `exceeds maxItems ${schema.maxItems}` });
      }
      for (let i = 0; i < value.length; i++) {
        const elementPath = joinPath(path, `[${i}]`);
        const elementErrors = validateSchema(value[i], schema.items, elementPath);
        for (const err of elementErrors) {
          errors.push(err);
        }
      }
      break;
    }

    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push({ path, message: `expected object but got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}` });
        return errors;
      }
      const obj = value as Record<string, unknown>;
      const required = schema.required ?? [];
      for (const key of required) {
        if (!(key in obj)) {
          errors.push({ path: joinPath(path, key), message: `is required` });
        }
      }
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const childPath = joinPath(path, key);
          const childErrors = validateSchema(obj[key], subSchema, childPath);
          for (const err of childErrors) {
            errors.push(err);
          }
        }
      }
      break;
    }
  }

  return errors;
}