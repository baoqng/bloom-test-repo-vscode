type Schema =
  | { type: 'string'; minLength?: number; maxLength?: number; pattern?: string }
  | { type: 'number'; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'array'; items: Schema; minItems?: number; maxItems?: number }
  | { type: 'object'; properties: Record<string, Schema>; required?: string[] };

type ValidationError = { path: string; message: string };

function validateSchema(value: unknown, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];
  validateValue(value, schema, '', errors);
  return errors;
}

function validateValue(value: unknown, schema: Schema, path: string, errors: ValidationError[]): void {
  // Check type first
  const typeMatch = checkType(value, schema.type);
  if (!typeMatch) {
    errors.push({ path, message: `expected type '${schema.type}' but got '${typeof value}'` });
    return; // Do not recurse on type mismatch
  }

  // Type-specific validation
  if (schema.type === 'string') {
    validateString(value as string, schema, path, errors);
  } else if (schema.type === 'number') {
    validateNumber(value as number, schema, path, errors);
  } else if (schema.type === 'array') {
    validateArray(value as unknown[], schema, path, errors);
  } else if (schema.type === 'object') {
    validateObject(value as Record<string, unknown>, schema, path, errors);
  }
  // 'boolean' and 'null' have no additional constraints
}

function checkType(value: unknown, expectedType: string): boolean {
  if (expectedType === 'string') {
    return typeof value === 'string';
  } else if (expectedType === 'number') {
    return typeof value === 'number' && !isNaN(value);
  } else if (expectedType === 'boolean') {
    return typeof value === 'boolean';
  } else if (expectedType === 'null') {
    return value === null;
  } else if (expectedType === 'array') {
    return Array.isArray(value);
  } else if (expectedType === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  return false;
}

function validateString(value: string, schema: Extract<Schema, { type: 'string' }>, path: string, errors: ValidationError[]): void {
  // Check minLength (raw length)
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({ path, message: `below minLength ${schema.minLength}` });
  }

  // Check maxLength (raw length)
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({ path, message: `exceeds maxLength ${schema.maxLength}` });
  }

  // Check pattern
  if (schema.pattern !== undefined) {
    try {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({ path, message: `does not match pattern '${schema.pattern}'` });
      }
    } catch (e) {
      errors.push({ path, message: `invalid regex pattern '${schema.pattern}'` });
    }
  }
}

function validateNumber(value: number, schema: Extract<Schema, { type: 'number' }>, path: string, errors: ValidationError[]): void {
  // Check min (inclusive)
  if (schema.min !== undefined && value < schema.min) {
    errors.push({ path, message: `below minimum ${schema.min}` });
  }

  // Check max (inclusive)
  if (schema.max !== undefined && value > schema.max) {
    errors.push({ path, message: `exceeds maximum ${schema.max}` });
  }

  // Check integer
  if (schema.integer === true && !Number.isInteger(value)) {
    errors.push({ path, message: `expected integer but got non-integer number` });
  }
}

function validateArray(value: unknown[], schema: Extract<Schema, { type: 'array' }>, path: string, errors: ValidationError[]): void {
  // Check minItems
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push({ path, message: `below minItems ${schema.minItems}` });
  }

  // Check maxItems
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push({ path, message: `exceeds maxItems ${schema.maxItems}` });
  }

  // Validate each element
  for (let i = 0; i < value.length; i++) {
    const elementPath = `${path}[${i}]`;
    validateValue(value[i], schema.items, elementPath, errors);
  }
}

function validateObject(value: Record<string, unknown>, schema: Extract<Schema, { type: 'object' }>, path: string, errors: ValidationError[]): void {
  const properties = schema.properties || {};
  const required = schema.required || [];

  // Check required fields
  for (const requiredKey of required) {
    if (!(requiredKey in value)) {
      const fieldPath = path ? `${path}.${requiredKey}` : requiredKey;
      errors.push({ path: fieldPath, message: `required property '${requiredKey}' is missing` });
    }
  }

  // Validate known properties
  for (const key of Object.keys(properties)) {
    if (key in value) {
      const propertySchema = properties[key];
      const propertyPath = path ? `${path}.${key}` : key;
      validateValue(value[key], propertySchema, propertyPath, errors);
    }
  }

  // Extra keys are skipped (no error)
}

export { validateSchema, ValidationError, Schema };