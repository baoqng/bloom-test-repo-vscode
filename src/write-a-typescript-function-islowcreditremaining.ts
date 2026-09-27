// bloom-deps:

export function isLowCredit(remaining: number, total: number): boolean {
  if (typeof remaining !== "number" || typeof total !== "number") {
    throw new TypeError("remaining and total must be numbers");
  }

  if (total <= 0) {
    return false;
  }

  return remaining / total < 0.2;
}