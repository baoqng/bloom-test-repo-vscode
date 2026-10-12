// bloom-deps:

if (typeof globalThis.HTMLElement === 'undefined') {
  (globalThis as any).HTMLElement = class HTMLElement {};
}

if (typeof globalThis.Element === 'undefined') {
  (globalThis as any).Element = class Element {};
}

export function findFocusedPanel(): HTMLElement | null {
  const result = document.querySelector('.bloom-panel.focused');
  if (result instanceof HTMLElement) {
    return result;
  }
  return null;
}