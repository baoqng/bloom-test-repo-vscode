// bloom-deps:

if (typeof globalThis.HTMLElement === 'undefined') {
  (globalThis as any).HTMLElement = class HTMLElement { textContent = ''; };
}
if (typeof globalThis.HTMLInputElement === 'undefined') {
  (globalThis as any).HTMLInputElement = class HTMLInputElement { value = ''; };
}

export function processElementValue(node: unknown): string {
  if (node instanceof HTMLInputElement) {
    return (node as HTMLInputElement).value;
  }
  if (node instanceof HTMLElement) {
    return (node as HTMLElement).textContent ?? '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return String(node);
  }
  if (node === null || node === undefined) {
    return '';
  }
  return '';
}