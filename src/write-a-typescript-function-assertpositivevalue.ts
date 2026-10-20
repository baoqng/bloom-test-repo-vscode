// bloom-deps:

export function assertPositive(value: number, label: string): void {
  if (value <= 0) {
    throw new TypeError(`${label} must be positive`);
  }
}