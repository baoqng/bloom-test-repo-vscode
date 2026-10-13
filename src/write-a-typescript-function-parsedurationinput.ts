// bloom-deps:

export function parseDuration(input: unknown): number {
  if (typeof input !== 'string') {
    throw new TypeError('input must be a string');
  }

  if (input.length === 0) {
    throw new SyntaxError('input must not be empty');
  }

  // Units in strictly descending order with their ms values
  const units: Array<{ unit: string; ms: number }> = [
    { unit: 'd', ms: 86400000 },
    { unit: 'h', ms: 3600000 },
    { unit: 'm', ms: 60000 },
    { unit: 's', ms: 1000 },
    { unit: 'ms', ms: 1 },
  ];

  const unitOrder: Record<string, number> = {
    'd': 0,
    'h': 1,
    'm': 2,
    's': 3,
    'ms': 4,
  };

  // Parse the string token by token: digits followed by a unit
  // We must handle 'ms' before 'm' and 's' individually
  let pos = 0;
  let lastUnitIndex = -1;
  let total = 0;

  while (pos < input.length) {
    // Must start with one or more digits
    if (!/\d/.test(input[pos])) {
      throw new SyntaxError(`Unexpected character at position ${pos}: '${input[pos]}'`);
    }

    // Consume digits
    const digitStart = pos;
    while (pos < input.length && /\d/.test(input[pos])) {
      pos++;
    }
    const digitStr = input.slice(digitStart, pos);
    const value = parseInt(digitStr, 10);

    // Now consume the unit — must be a recognized unit
    // Try 'ms' first (two chars), then single-char units
    let matchedUnit: string | null = null;

    if (pos + 1 < input.length && input.slice(pos, pos + 2) === 'ms') {
      // Check that the character after 'ms' is not a letter (avoid 'msd' being 'ms' + 'd' erroneously)
      // Actually 'ms' followed by digits would be caught in next iteration
      matchedUnit = 'ms';
      pos += 2;
    } else if (pos < input.length) {
      const ch = input[pos];
      if (ch === 'd' || ch === 'h' || ch === 'm' || ch === 's') {
        matchedUnit = ch;
        pos += 1;
      } else {
        throw new SyntaxError(`Unknown unit at position ${pos}: '${ch}'`);
      }
    } else {
      // digits at end of string with no unit
      throw new SyntaxError(`Number without a unit at position ${digitStart}`);
    }

    const currentUnitIndex = unitOrder[matchedUnit];

    // Check strictly descending order (no repeats)
    if (currentUnitIndex <= lastUnitIndex) {
      if (currentUnitIndex === lastUnitIndex) {
        throw new SyntaxError(`Repeated unit: '${matchedUnit}'`);
      } else {
        throw new SyntaxError(`Units out of order: '${matchedUnit}' cannot follow previous unit`);
      }
    }

    lastUnitIndex = currentUnitIndex;

    const msPerUnit = units[currentUnitIndex].ms;
    const contribution = value * msPerUnit;

    total += contribution;

    if (total > Number.MAX_SAFE_INTEGER) {
      throw new RangeError('Duration exceeds Number.MAX_SAFE_INTEGER milliseconds');
    }
  }

  // After consuming all input, if we haven't consumed anything meaningful
  // (e.g. input was empty — already handled above), we're done.
  // But we need to verify the entire string was consumed (it always is since we parse char by char)

  return total;
}