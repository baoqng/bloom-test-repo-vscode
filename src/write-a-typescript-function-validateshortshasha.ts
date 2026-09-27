// bloom-deps:

export function validateShortSHA(sha: string): boolean {
  try {
    if (typeof sha !== 'string') {
      return false;
    }
    return /^[0-9a-f]{7,12}$/.test(sha);
  } catch {
    return false;
  }
}