// bloom-deps:

import type { FetchMiddleware, HttpFetchFn } from './fetchTypes';

/**
 * Composes the middleware stack around `fetch` and returns the resulting function.
 * The first middleware in the array is the outermost wrapper — it executes first
 * on the unmodified request and last on the response.
 *
 * If `middlewares` is empty, `fetch` is returned unchanged.
 * The `middlewares` array is never mutated.
 */
export function applyMiddleware(
	fetch: HttpFetchFn,
	middlewares: readonly FetchMiddleware[],
): HttpFetchFn {
	if (middlewares.length === 0) {
		return fetch;
	}

	// reduceRight builds the chain so that middlewares[0] wraps the outermost layer.
	// e.g. [a, b, c] produces a(b(c(fetch)))
	return middlewares.reduceRight<HttpFetchFn>(
		(next, middleware) => middleware(next),
		fetch,
	);
}