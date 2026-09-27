// bloom-deps:

export function parseGitHash(hash: string): string {
  if (typeof hash !== 'string') {
    throw new TypeError(`Invalid git hash: ${hash}`);
  }

  if (hash.length === 0 || hash.length < 7 || hash.length > 40 || !/^[0-9a-fA-F]+$/.test(hash)) {
    throw new TypeError(`Invalid git hash: ${hash}`);
  }

  return hash.toLowerCase();
}