// bloom-deps:

export function isWebhookTimestampFresh(
  headerValue: unknown,
  nowSeconds: unknown,
  toleranceSeconds: unknown
): boolean {
  try {
    // Validate headerValue: must be a string of 1 to 12 ASCII digits only
    if (typeof headerValue !== 'string') {
      return false;
    }
    if (!/^\d{1,12}$/.test(headerValue)) {
      return false;
    }

    // Validate nowSeconds: must be a non-negative safe integer
    if (
      typeof nowSeconds !== 'number' ||
      !Number.isFinite(nowSeconds) ||
      !Number.isInteger(nowSeconds) ||
      nowSeconds < 0 ||
      nowSeconds > Number.MAX_SAFE_INTEGER
    ) {
      return false;
    }

    // Validate toleranceSeconds: must be a non-negative safe integer
    if (
      typeof toleranceSeconds !== 'number' ||
      !Number.isFinite(toleranceSeconds) ||
      !Number.isInteger(toleranceSeconds) ||
      toleranceSeconds < 0 ||
      toleranceSeconds > Number.MAX_SAFE_INTEGER
    ) {
      return false;
    }

    const parsedTimestamp = parseInt(headerValue, 10);
    const diff = Math.abs(nowSeconds - parsedTimestamp);

    return diff <= toleranceSeconds;
  } catch {
    return false;
  }
}