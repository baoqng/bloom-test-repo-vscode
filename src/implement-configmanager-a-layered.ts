// bloom-deps:

type Primitive = string | number | boolean;
type ConfigValue = Primitive | ConfigValue[] | { [key: string]: ConfigValue };

interface ConfigLayer {
  name: string;
  values: Record<string, ConfigValue>;
}

const RUNTIME_OVERRIDE_LAYER_NAME = '__runtime_override__';

function getAtPath(obj: Record<string, ConfigValue>, path: string): ConfigValue | undefined {
  const parts = path.split('.');
  let current: ConfigValue = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    const record = current as Record<string, ConfigValue>;
    if (!Object.prototype.hasOwnProperty.call(record, part)) {
      return undefined;
    }
    current = record[part];
  }
  return current;
}

function setAtPath(obj: Record<string, ConfigValue>, path: string, value: ConfigValue): void {
  const parts = path.split('.');
  let current: Record<string, ConfigValue> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!Object.prototype.hasOwnProperty.call(current, part) || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, ConfigValue>;
  }
  current[parts[parts.length - 1]] = value;
}

function flattenToRecord(obj: Record<string, ConfigValue>, prefix: string, result: Record<string, ConfigValue>): void {
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flattenToRecord(val as Record<string, ConfigValue>, fullPath, result);
    } else {
      result[fullPath] = val;
    }
  }
}

export class ConfigManager {
  private layers: ConfigLayer[];
  private runtimeOverride: ConfigLayer | null;

  constructor(defaults?: Record<string, ConfigValue>) {
    this.layers = [];
    this.runtimeOverride = null;
    if (defaults) {
      this.layers.push({ name: '__defaults__', values: defaults });
    }
  }

  addLayer(layer: ConfigLayer): void {
    this.layers.push(layer);
  }

  removeLayer(name: string): boolean {
    if (name === RUNTIME_OVERRIDE_LAYER_NAME && this.runtimeOverride !== null) {
      this.runtimeOverride = null;
      return true;
    }
    const idx = this.layers.findIndex(l => l.name === name);
    if (idx === -1) {
      return false;
    }
    this.layers.splice(idx, 1);
    return true;
  }

  get(path: string): ConfigValue | undefined {
    // Runtime override has highest priority
    if (this.runtimeOverride !== null) {
      const val = getAtPath(this.runtimeOverride.values, path);
      if (val !== undefined) {
        return val;
      }
    }
    // Iterate layers in reverse (last added = highest priority)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const val = getAtPath(this.layers[i].values, path);
      if (val !== undefined) {
        return val;
      }
    }
    return undefined;
  }

  has(path: string): boolean {
    return this.get(path) !== undefined;
  }

  getString(path: string, fallback?: string): string {
    const val = this.get(path);
    if (val === undefined) {
      if (fallback !== undefined) return fallback;
      return fallback as unknown as string;
    }
    if (typeof val === 'object' || Array.isArray(val)) {
      throw new TypeError(`Value at path '${path}' is an object or array and cannot be coerced to string`);
    }
    return String(val);
  }

  getNumber(path: string, fallback?: number): number {
    const val = this.get(path);
    if (val === undefined) {
      if (fallback !== undefined) return fallback;
      return fallback as unknown as number;
    }
    if (typeof val === 'object' || Array.isArray(val)) {
      throw new TypeError(`Value at path '${path}' is an object or array and cannot be coerced to number`);
    }
    if (typeof val === 'number') {
      if (!isFinite(val)) {
        throw new TypeError(`Value at path '${path}' is not a finite number`);
      }
      return val;
    }
    if (typeof val === 'boolean') {
      return val ? 1 : 0;
    }
    // string
    const coerced = Number(val as string);
    if (!isFinite(coerced) || (val as string).trim() === '') {
      throw new TypeError(`Value at path '${path}' ('${val}') cannot be coerced to a finite number`);
    }
    return coerced;
  }

  getBoolean(path: string, fallback?: boolean): boolean {
    const val = this.get(path);
    if (val === undefined) {
      if (fallback !== undefined) return fallback;
      return fallback as unknown as boolean;
    }
    if (typeof val === 'object' || Array.isArray(val)) {
      throw new TypeError(`Value at path '${path}' is an object or array and cannot be coerced to boolean`);
    }
    if (typeof val === 'boolean') {
      return val;
    }
    if (typeof val === 'number') {
      if (val === 1) return true;
      if (val === 0) return false;
      throw new TypeError(`Value at path '${path}' (${val}) cannot be coerced to boolean`);
    }
    // string
    const s = val as string;
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
    throw new TypeError(`Value at path '${path}' ('${s}') cannot be coerced to boolean; only 'true', 'false', '1', '0' are valid`);
  }

  set(path: string, value: ConfigValue): void {
    if (this.runtimeOverride === null) {
      this.runtimeOverride = { name: RUNTIME_OVERRIDE_LAYER_NAME, values: {} };
    }
    setAtPath(this.runtimeOverride.values, path, value);
  }

  getAll(): Record<string, ConfigValue> {
    const result: Record<string, ConfigValue> = {};

    // Start from lowest priority (defaults first, then layers in order)
    for (let i = 0; i < this.layers.length; i++) {
      const flat: Record<string, ConfigValue> = {};
      flattenToRecord(this.layers[i].values, '', flat);
      for (const key of Object.keys(flat)) {
        result[key] = flat[key];
      }
    }

    // Runtime override has highest priority
    if (this.runtimeOverride !== null) {
      const flat: Record<string, ConfigValue> = {};
      flattenToRecord(this.runtimeOverride.values, '', flat);
      for (const key of Object.keys(flat)) {
        result[key] = flat[key];
      }
    }

    return result;
  }
}