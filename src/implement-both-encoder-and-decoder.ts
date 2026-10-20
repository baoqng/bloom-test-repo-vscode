// bloom-deps:

type RLEPair<T> = [count: number, value: T];

export function runLengthEncode<T>(input: T[]): RLEPair<T>[] {
  if (!Array.isArray(input)) {
    throw new TypeError('input must be an array');
  }
  if (input.length === 0) {
    return [];
  }
  const result: RLEPair<T>[] = [];
  let count = 1;
  let current = input[0];
  for (let i = 1; i < input.length; i++) {
    if (Object.is(input[i], current)) {
      count++;
    } else {
      result.push([count, current]);
      current = input[i];
      count = 1;
    }
  }
  result.push([count, current]);
  return result;
}

export function runLengthDecode<T>(encoded: RLEPair<T>[]): T[] {
  if (!Array.isArray(encoded)) {
    throw new TypeError('encoded must be an array');
  }
  if (encoded.length === 0) {
    return [];
  }
  for (const element of encoded) {
    if (!Array.isArray(element) || element.length !== 2) {
      throw new TypeError('each encoded element must be an array of length 2');
    }
    const count = element[0];
    if (
      typeof count !== 'number' ||
      !Number.isInteger(count) ||
      count < 1
    ) {
      throw new RangeError('count must be a positive integer');
    }
  }
  const result: T[] = [];
  for (const [count, value] of encoded) {
    for (let i = 0; i < count; i++) {
      result.push(value);
    }
  }
  return result;
}