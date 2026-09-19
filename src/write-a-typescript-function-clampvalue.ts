// bloom-deps:

export function clamp(value: number, min: number, max: number): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new RangeError("value must be a valid number");
  }
  if (typeof min !== "number" || isNaN(min)) {
    throw new RangeError("min must be a valid number");
  }
  if (typeof max !== "number" || isNaN(max)) {
    throw new RangeError("max must be a valid number");
  }
  if (min > max) {
    throw new RangeError(`min (${min}) must not be greater than max (${max})`);
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}