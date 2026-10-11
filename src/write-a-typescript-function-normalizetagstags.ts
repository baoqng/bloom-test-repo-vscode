// bloom-deps:

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    throw new TypeError('tags must be an array');
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < tags.length; i++) {
    const element = tags[i];

    if (typeof element !== 'string') {
      throw new TypeError(`tags[${i}] must be a string`);
    }

    const trimmed = element.trim().toLowerCase();

    if (trimmed.length === 0) {
      throw new RangeError(`tags[${i}] is empty after trimming`);
    }

    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      throw new SyntaxError(
        `tags[${i}] contains invalid characters: only a-z, 0-9, and \u2018-\u2019 are allowed`
      );
    }

    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
}