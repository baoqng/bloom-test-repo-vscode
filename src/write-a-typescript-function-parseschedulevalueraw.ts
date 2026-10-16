// bloom-deps:

export function parseScheduleValue(raw: string): { type: 'date'; value: Date } | { type: 'count'; value: number } | null {
  // Guard: reject negative number strings using /^-\d/ (not /^-/ to avoid blocking negative-year ISO dates)
  if (/^-\d/.test(raw)) {
    return null;
  }

  // Guard: reject near-valid numeric strings (signed, decimal, whitespace, empty)
  if (raw === '' || /\s/.test(raw)) {
    return null;
  }

  // Check for digit-only string (count)
  if (/^\d+$/.test(raw)) {
    const count = parseInt(raw, 10);
    if (count > 0) {
      return { type: 'count', value: count };
    }
    return null;
  }

  // Check for ISO date string: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ
  const isoDateOnly = /^\d{4}-(\d{2})-(\d{2})$/;
  const isoDateTime = /^\d{4}-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}Z$/;

  let dateMatch: RegExpMatchArray | null = null;
  let isDateFormat = false;

  if (isoDateOnly.test(raw)) {
    dateMatch = raw.match(isoDateOnly);
    isDateFormat = true;
  } else if (isoDateTime.test(raw)) {
    dateMatch = raw.match(isoDateTime);
    isDateFormat = true;
  }

  if (isDateFormat && dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);

    // Validate month
    if (month < 1 || month > 12) {
      return null;
    }

    // Validate day
    if (day < 1) {
      return null;
    }

    // Extract year for leap year calculation
    const yearStr = raw.substring(0, 4);
    const year = parseInt(yearStr, 10);

    const daysInMonth = getDaysInMonth(year, month);
    if (day > daysInMonth) {
      return null;
    }

    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      return null;
    }

    return { type: 'date', value: date };
  }

  // All other inputs return null
  return null;
}

function getDaysInMonth(year: number, month: number): number {
  // month is 1-based
  // Using Date(year, month, 0) gives the last day of the previous month
  return new Date(year, month, 0).getDate();
}