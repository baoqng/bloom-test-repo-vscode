// bloom-deps:

export function parseSetCookie(header: unknown): { name: string; value: string; attributes: Record<string, string | true> } {
  if (typeof header !== 'string') {
    throw new TypeError('header must be a string');
  }

  const parts = header.split(';');

  const nameValuePart = parts[0];
  const eqIndex = nameValuePart.indexOf('=');

  let name: string;
  let value: string;

  if (eqIndex === -1) {
    name = nameValuePart.trim();
    value = '';
  } else {
    name = nameValuePart.slice(0, eqIndex).trim();
    value = nameValuePart.slice(eqIndex + 1).trim();
  }

  if (name.length === 0) {
    throw new SyntaxError('Cookie name must be non-empty');
  }

  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      throw new SyntaxError('Cookie name must not contain control characters');
    }
    if (name[i] === ' ') {
      throw new SyntaxError('Cookie name must not contain spaces');
    }
    if (name[i] === '=') {
      throw new SyntaxError('Cookie name must not contain "="');
    }
  }

  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  const attributes: Record<string, string | true> = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.length === 0) {
      continue;
    }

    const attrEqIndex = part.indexOf('=');
    if (attrEqIndex === -1) {
      const attrKey = part.toLowerCase();
      attributes[attrKey] = true;
    } else {
      const attrKey = part.slice(0, attrEqIndex).trim().toLowerCase();
      const attrValue = part.slice(attrEqIndex + 1).trim();

      if (attrKey === 'max-age') {
        if (!/^-?\d+$/.test(attrValue)) {
          throw new RangeError(`Max-Age attribute value is invalid: "${attrValue}"`);
        }
      }

      attributes[attrKey] = attrValue;
    }
  }

  return { name, value, attributes };
}