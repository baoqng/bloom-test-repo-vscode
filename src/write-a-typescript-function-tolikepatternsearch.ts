// bloom-deps:

export function toLikePattern(
  search: unknown,
  mode: 'contains' | 'prefix' | 'suffix' | 'exact',
  escapeChar: string = '\\'
): string {
  if (typeof search !== 'string') {
    throw new TypeError('search must be a string');
  }

  if (escapeChar.length !== 1) {
    throw new RangeError('escapeChar must be exactly one character');
  }

  if (escapeChar === '%') {
    throw new RangeError("escapeChar must not be '%'");
  }

  if (escapeChar === '_') {
    throw new RangeError("escapeChar must not be '_'");
  }

  if (mode !== 'contains' && mode !== 'prefix' && mode !== 'suffix' && mode !== 'exact') {
    throw new RangeError("mode must be one of 'contains', 'prefix', 'suffix', 'exact'");
  }

  // First escape every occurrence of escapeChar by doubling it
  let escaped = search.split(escapeChar).join(escapeChar + escapeChar);

  // Then prefix every '%' and '_' with escapeChar
  escaped = escaped.split('%').join(escapeChar + '%');
  escaped = escaped.split('_').join(escapeChar + '_');

  switch (mode) {
    case 'contains':
      return '%' + escaped + '%';
    case 'prefix':
      return escaped + '%';
    case 'suffix':
      return '%' + escaped;
    case 'exact':
      return escaped;
  }
}