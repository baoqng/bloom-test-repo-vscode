// bloom-deps:

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function shouldShowFeedbackPrompt(
  status: string,
  prUrl: string | null | undefined,
  lastPromptedAt: number | null,
  now: number
): boolean {
  if (typeof status !== 'string') {
    throw new TypeError('status must be a string');
  }

  if (typeof now !== 'number' || !Number.isFinite(now)) {
    throw new TypeError('now must be a finite number');
  }

  if (status !== 'complete') {
    return false;
  }

  if (!prUrl) {
    return false;
  }

  if (lastPromptedAt === null) {
    return true;
  }

  return now - lastPromptedAt >= TWENTY_FOUR_HOURS_MS;
}