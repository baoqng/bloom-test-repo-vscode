// bloom-deps:

function validateAndFetch(url: string, options?: { timeout?: number }): Promise<string> {
  if (typeof url !== 'string' || url === '') {
    throw new TypeError('url must be a non-empty string');
  }

  if (options !== undefined && options.timeout !== undefined) {
    const t = options.timeout;
    if (typeof t !== 'number' || !isFinite(t) || t <= 0) {
      throw new TypeError('timeout must be a positive number');
    }
  }

  return Promise.resolve('response:' + url);
}

export { validateAndFetch };