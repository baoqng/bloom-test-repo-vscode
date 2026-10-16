// bloom-deps:

function validateBatchPayload<T>(items: T[], processor: (item: T) => Promise<string>): Promise<string[]> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError('items must be a non-empty array');
  }
  if (typeof processor !== 'function') {
    throw new TypeError('processor must be a function');
  }
  return Promise.all(items.map(processor));
}

export { validateBatchPayload };