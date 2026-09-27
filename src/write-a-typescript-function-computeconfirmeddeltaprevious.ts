// bloom-deps:

export function computeConfirmedDelta(previous: number | null, current: number): number {
  if (previous === null) {
    return 0;
  }
  if (current <= previous) {
    return 0;
  }
  return current - previous;
}