// bloom-deps:

export function buildAuthHeader(token: string): { Authorization: string } {
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('token must be a non-empty string');
  }
  
  return {
    Authorization: 'Bearer ' + token
  };
}