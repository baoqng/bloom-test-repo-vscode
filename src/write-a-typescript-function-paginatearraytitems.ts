// bloom-deps:

export interface PaginationResult<T> {
	items: T[];
	total: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export function paginateArray<T>(
	items: T[],
	pageSize: number,
	pageNumber: number
): PaginationResult<T> {
	// Validate items is an array
	if (!Array.isArray(items)) {
		throw new TypeError("items must be an array");
	}

	// Validate pageSize is a positive integer
	if (!Number.isInteger(pageSize) || pageSize <= 0) {
		throw new TypeError("pageSize must be a positive integer");
	}

	// Validate pageNumber is a positive integer
	if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
		throw new TypeError("pageNumber must be a positive integer");
	}

	const total = items.length;
	const pages = Math.max(1, Math.ceil(total / pageSize));

	// Determine if we're requesting a valid page
	const isValidPage = pageNumber <= pages;

	// Calculate slice boundaries
	const startIndex = (pageNumber - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	// Get the slice for this page (empty array if page number exceeds pages)
	const pageItems = isValidPage ? items.slice(startIndex, endIndex) : [];

	// Determine if there are next pages
	const hasNext = pageNumber < pages;

	// Determine if there are previous pages
	const hasPrev = pageNumber > 1;

	return {
		items: pageItems,
		total,
		pages,
		hasNext,
		hasPrev
	};
}