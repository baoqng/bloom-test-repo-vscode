type Schema =
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: string }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'array'; items: Schema; minItems?: number; maxItems?: number }
  | { type: 'object'; properties: Record<string, Schema>; required?: string[] };

type ValidationError = { path: string; message: string };

export function validateSchema(value: unknown, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];
  validateValue(value, schema, '', errors);
  return errors;
}

function validateValue(value: unknown, schema: Schema, path: string, errors: ValidationError[]): void {
  const schemaType = schema.type;

  // Type mismatch check
  if (!isValueOfType(value, schemaType)) {
    errors.push({
      path,
      message: `must be of type ${schemaType}`,
    });
    return;
  }

  // Type-specific validation
  if (schemaType === 'string') {
    validateString(value as string, schema as Extract<Schema, { type: 'string' }>, path, errors);
  } else if (schemaType === 'number') {
    validateNumber(value as number, schema as Extract<Schema, { type: 'number' }>, path, errors);
  } else if (schemaType === 'boolean') {
    // No additional validation for boolean
  } else if (schemaType === 'null') {
    // No additional validation for null
  } else if (schemaType === 'array') {
    validateArray(value as unknown[], schema as Extract<Schema, { type: 'array' }>, path, errors);
  } else if (schemaType === 'object') {
    validateObject(value as Record<string, unknown>, schema as Extract<Schema, { type: 'object' }>, path, errors);
  }
}

function isValueOfType(value: unknown, schemaType: string): boolean {
  switch (schemaType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    default:
      return false;
  }
}

function validateString(
  value: string,
  schema: Extract<Schema, { type: 'string' }>,
  path: string,
  errors: ValidationError[]
): void {
  // Check minLength
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({
      path,
      message: `below minLength ${schema.minLength}`,
    });
  }

  // Check maxLength
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({
      path,
      message: `exceeds maxLength ${schema.maxLength}`,
    });
  }

  // Check pattern
  if (schema.pattern !== undefined) {
    try {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `does not match pattern ${schema.pattern}`,
        });
      }
    } catch {
      errors.push({
        path,
        message: `invalid regex pattern ${schema.pattern}`,
      });
    }
  }
}

function validateNumber(
  value: number,
  schema: Extract<Schema, { type: 'number' }>,
  path: string,
  errors: ValidationError[]
): void {
  // Check integer constraint
  if (schema.integer === true && !Number.isInteger(value)) {
    errors.push({
      path,
      message: `must be an integer`,
    });
  }

  // Check min (inclusive)
  if (schema.min !== undefined && value < schema.min) {
    errors.push({
      path,
      message: `below minimum ${schema.min}`,
    });
  }

  // Check max (inclusive)
  if (schema.max !== undefined && value > schema.max) {
    errors.push({
      path,
      message: `exceeds maximum ${schema.max}`,
    });
  }
}

function validateArray(
  value: unknown[],
  schema: Extract<Schema, { type: 'array' }>,
  path: string,
  errors: ValidationError[]
): void {
  // Check minItems
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push({
      path,
      message: `has fewer than minItems ${schema.minItems}`,
    });
  }

  // Check maxItems
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push({
      path,
      message: `has more than maxItems ${schema.maxItems}`,
    });
  }

  // Validate each element
  for (let i = 0; i < value.length; i++) {
    const elementPath = `${path}[${i}]`;
    validateValue(value[i], schema.items, elementPath, errors);
  }
}

function joinPath(parent: string, child: string): string {
  if (parent === '') return child;
  return `${parent}.${child}`;
}

function validateObject(
  value: Record<string, unknown>,
  schema: Extract<Schema, { type: 'object' }>,
  path: string,
  errors: ValidationError[]
): void {
  // Check required fields
  if (schema.required) {
    for (const requiredKey of schema.required) {
      if (!(requiredKey in value)) {
        const fieldPath = joinPath(path, requiredKey);
        errors.push({
          path: fieldPath,
          message: `missing required property`,
        });
      }
    }
  }

  // Validate known properties
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (key in value) {
      const fieldPath = joinPath(path, key);
      validateValue(value[key], propSchema, fieldPath, errors);
    }
  }
  // Note: extra keys are skipped (no error)
}