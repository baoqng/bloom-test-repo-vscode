// bloom-deps:

export function parseCronField(field: unknown, min: number, max: number): number[] {
  if (typeof field !== 'string') {
    throw new TypeError(`field must be a string, got ${typeof field}`);
  }

  if (!Number.isInteger(min)) {
    throw new RangeError(`min must be an integer, got ${min}`);
  }

  if (!Number.isInteger(max)) {
    throw new RangeError(`max must be an integer, got ${max}`);
  }

  if (min > max) {
    throw new RangeError(`min (${min}) must not be greater than max (${max})`);
  }

  // Check for whitespace anywhere in the field
  if (/\s/.test(field)) {
    throw new SyntaxError(`field must not contain whitespace: ${JSON.stringify(field)}`);
  }

  const items = field.split(',');

  const resultSet = new Set<number>();

  for (const item of items) {
    if (item === '') {
      throw new SyntaxError(`field contains an empty item: ${JSON.stringify(field)}`);
    }

    // Split by '/' for step
    const slashParts = item.split('/');
    if (slashParts.length > 2) {
      throw new SyntaxError(`invalid step syntax in item: ${JSON.stringify(item)}`);
    }

    let step = 1;
    if (slashParts.length === 2) {
      const stepStr = slashParts[1];
      // step must be a positive integer string (no leading zeros unless '1', etc.)
      if (!/^\d+$/.test(stepStr)) {
        throw new SyntaxError(`step must be a positive integer, got ${JSON.stringify(stepStr)} in item ${JSON.stringify(item)}`);
      }
      step = Number(stepStr);
      if (!Number.isInteger(step) || step <= 0) {
        throw new SyntaxError(`step must be a positive integer, got ${step} in item ${JSON.stringify(item)}`);
      }
    }

    const base = slashParts[0];

    let start: number;
    let end: number;

    if (base === '*') {
      start = min;
      end = max;
    } else {
      // Must be a number or a range a-b
      // We need to be careful: negative numbers are not allowed (they would start with '-')
      // The pattern for a valid number: digits only (no leading sign)
      // The pattern for a valid range: digits-digits
      // Use /^-\d/ pattern to reject negative numbers per team pattern

      // Split on '-' but be careful: only one '-' allowed for ranges
      // A valid base is either: all digits, or digits-digits
      // We'll try to parse it
      const rangeParts = base.split('-');

      if (rangeParts.length === 1) {
        // Single number
        const numStr = rangeParts[0];
        if (!/^\d+$/.test(numStr)) {
          throw new SyntaxError(`invalid item syntax: ${JSON.stringify(item)}`);
        }
        const num = Number(numStr);
        if (!Number.isInteger(num) || num < min || num > max) {
          throw new RangeError(`number ${num} is outside [${min}, ${max}] in item ${JSON.stringify(item)}`);
        }
        if (slashParts.length === 2) {
          // Single number with step: expand from num to max
          start = num;
          end = max;
        } else {
          start = num;
          end = num;
        }
      } else if (rangeParts.length === 2) {
        // Range a-b
        const aStr = rangeParts[0];
        const bStr = rangeParts[1];

        if (!/^\d+$/.test(aStr)) {
          throw new SyntaxError(`invalid range start in item: ${JSON.stringify(item)}`);
        }
        if (!/^\d+$/.test(bStr)) {
          throw new SyntaxError(`invalid range end in item: ${JSON.stringify(item)}`);
        }

        const a = Number(aStr);
        const b = Number(bStr);

        if (!Number.isInteger(a) || a < min || a > max) {
          throw new RangeError(`range start ${a} is outside [${min}, ${max}] in item ${JSON.stringify(item)}`);
        }
        if (!Number.isInteger(b) || b < min || b > max) {
          throw new RangeError(`range end ${b} is outside [${min}, ${max}] in item ${JSON.stringify(item)}`);
        }
        if (a > b) {
          throw new RangeError(`range start ${a} is greater than range end ${b} in item ${JSON.stringify(item)}`);
        }

        start = a;
        end = b;
      } else {
        // More than one '-' which means invalid
        throw new SyntaxError(`invalid item syntax (multiple hyphens): ${JSON.stringify(item)}`);
      }
    }

    for (let v = start; v <= end; v += step) {
      resultSet.add(v);
    }
  }

  return Array.from(resultSet).sort((a, b) => a - b);
}