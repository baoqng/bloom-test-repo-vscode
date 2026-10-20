// bloom-deps:
export function validateAge(age: number): void {
  if (age < 0 || age > 150) {
    throw new RangeError('Age must be between 0 and 150');
  }
}