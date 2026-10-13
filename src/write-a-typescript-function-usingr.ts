// bloom-deps:

function using<R, T>(
  acquire: () => Promise<R>,
  body: (resource: R) => Promise<T>,
  release: (resource: R) => Promise<void>
): Promise<T> {
  if (typeof acquire !== 'function') {
    throw new TypeError('acquire must be a function');
  }
  if (typeof body !== 'function') {
    throw new TypeError('body must be a function');
  }
  if (typeof release !== 'function') {
    throw new TypeError('release must be a function');
  }

  return (async () => {
    let resource: R;
    try {
      resource = await acquire();
    } catch (acquireError) {
      throw acquireError;
    }

    let bodyResult: T;
    let bodyError: unknown;
    let bodySucceeded = false;

    try {
      bodyResult = await body(resource);
      bodySucceeded = true;
    } catch (err) {
      bodyError = err;
    }

    let releaseError: unknown;
    let releaseSucceeded = false;

    try {
      await release(resource!);
      releaseSucceeded = true;
    } catch (err) {
      releaseError = err;
    }

    if (bodySucceeded && releaseSucceeded) {
      return bodyResult!;
    } else if (bodySucceeded && !releaseSucceeded) {
      throw releaseError;
    } else if (!bodySucceeded && releaseSucceeded) {
      throw bodyError;
    } else {
      throw new AggregateError([bodyError, releaseError], 'body and release both failed');
    }
  })();
}

export { using };