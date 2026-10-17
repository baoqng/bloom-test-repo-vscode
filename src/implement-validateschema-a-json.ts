// bloom-deps:

interface Schema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  items?: Schema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minItems?: number;
  maxItems?: number;
  enum?: unknown[];
  pattern?: string;
  nullable?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSchemaInternal(value: unknown, schema: Schema, path: string): string[] {
  const errors: string[] = [];

  function addError(msg: string): void {
    if (path) {
      errors.push(`${path}: ${msg}`);
    } else {
      errors.push(msg);
    }
  }

  // nullable: true means null is always valid
  if (value === null && schema.nullable === true) {
    return errors;
  }

  // enum check
  if (schema.enum !== undefined) {
    const matched = schema.enum.some(e => e === value);
    if (!matched) {
      addError(`enum violation: value must be one of ${JSON.stringify(schema.enum)}`);
      return errors;
    }
    // If enum matches, we still validate other constraints below
    // Actually per spec, if enum matches we can return early for enum itself
    // but other constraints could still apply — however typical JSON Schema
    // just checks enum. We'll return here since enum match is the primary gate.
    return errors;
  }

  // type check
  if (schema.type !== undefined) {
    const typeValid = checkType(value, schema.type, schema.nullable ?? false);
    if (!typeValid) {
      addError(`type violation: expected ${schema.type}, got ${getValueType(value)}`);
      // If required is set and value is not an object, report type error (not required)
      return errors;
    }
  }

  // If type is not set but required is present and value is not an object, report type error
  if (schema.type === undefined && schema.required !== undefined) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      addError(`type violation: expected object for required validation, got ${getValueType(value)}`);
      return errors;
    }
  }

  const valueType = getValueType(value);

  // string validations
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      addError(`minLength violation: length ${value.length} < ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      addError(`maxLength violation: length ${value.length} > ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        addError(`pattern violation: value does not match pattern ${schema.pattern}`);
      }
    }
  }

  // numeric validations — only apply if value is a number
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && schema.exclusiveMinimum !== undefined) {
      // exclusiveMinimum takes precedence when both set to same value
      if (value <= schema.exclusiveMinimum) {
        addError(`exclusiveMinimum violation: value ${value} must be > ${schema.exclusiveMinimum}`);
      } else if (value < schema.minimum && value > schema.exclusiveMinimum) {
        addError(`minimum violation: value ${value} < ${schema.minimum}`);
      }
    } else if (schema.exclusiveMinimum !== undefined) {
      if (value <= schema.exclusiveMinimum) {
        addError(`exclusiveMinimum violation: value ${value} must be > ${schema.exclusiveMinimum}`);
      }
    } else if (schema.minimum !== undefined) {
      if (value < schema.minimum) {
        addError(`minimum violation: value ${value} < ${schema.minimum}`);
      }
    }

    if (schema.maximum !== undefined && schema.exclusiveMaximum !== undefined) {
      if (value >= schema.exclusiveMaximum) {
        addError(`exclusiveMaximum violation: value ${value} must be < ${schema.exclusiveMaximum}`);
      } else if (value > schema.maximum && value < schema.exclusiveMaximum) {
        addError(`maximum violation: value ${value} > ${schema.maximum}`);
      }
    } else if (schema.exclusiveMaximum !== undefined) {
      if (value >= schema.exclusiveMaximum) {
        addError(`exclusiveMaximum violation: value ${value} must be < ${schema.exclusiveMaximum}`);
      }
    } else if (schema.maximum !== undefined) {
      if (value > schema.maximum) {
        addError(`maximum violation: value ${value} > ${schema.maximum}`);
      }
    }
  }

  // object validations
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const knownKeys = new Set(schema.properties ? Object.keys(schema.properties) : []);

    // required
    if (schema.required !== undefined) {
      for (const key of schema.required) {
        if (!(key in obj)) {
          addError(`required violation: missing required property '${key}'`);
        }
      }
    }

    // properties
    if (schema.properties !== undefined) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const propPath = path ? `${path}/properties.${key}` : `properties.${key}`;
          const propErrors = validateSchemaInternal(obj[key], propSchema, propPath);
          errors.push(...propErrors);
        }
      }
    }

    // additionalProperties
    if (schema.additionalProperties !== undefined) {
      const extraKeys = Object.keys(obj).filter(k => !knownKeys.has(k));
      if (schema.additionalProperties === false) {
        for (const key of extraKeys) {
          addError(`additionalProperties violation: extra key '${key}' is not allowed`);
        }
      } else if (typeof schema.additionalProperties === 'object' && schema.additionalProperties !== null) {
        const additionalSchema = schema.additionalProperties as Schema;
        for (const key of extraKeys) {
          const propPath = path ? `${path}/properties.${key}` : `properties.${key}`;
          const propErrors = validateSchemaInternal(obj[key], additionalSchema, propPath);
          errors.push(...propErrors);
        }
      }
    }
  }

  // array validations
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      addError(`minItems violation: length ${value.length} < ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      addError(`maxItems violation: length ${value.length} > ${schema.maxItems}`);
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => {
        const itemPath = path ? `${path}/items[${index}]` : `items[${index}]`;
        const itemErrors = validateSchemaInternal(item, schema.items!, itemPath);
        errors.push(...itemErrors);
      });
    }
  }

  return errors;
}

function checkType(value: unknown, type: string, nullable: boolean): boolean {
  if (value === null) {
    return type === 'null' || nullable;
  }
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && isFinite(value);
    case 'integer':
      return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return false;
  }
}

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function validateSchema(value: unknown, schema: Schema): ValidationResult {
  if (typeof schema !== 'object' || schema === null) {
    throw new TypeError('schema must be an object');
  }
  const errors = validateSchemaInternal(value, schema, '');
  return {
    valid: errors.length === 0,
    errors,
  };
}