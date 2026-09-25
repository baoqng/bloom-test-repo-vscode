// bloom-deps:

function filterByExtension(paths: string[], extensions: string[]): string[] {
  if (!Array.isArray(paths)) {
    throw new TypeError('paths must be an array');
  }
  if (!Array.isArray(extensions) || extensions.length === 0) {
    throw new TypeError('extensions must be a non-empty array');
  }

  const normalizedExtensions = new Set<string>(
    extensions.map(ext => {
      if (ext === '' || ext === '.') {
        return '';
      }
      const lower = ext.toLowerCase();
      return lower.startsWith('.') ? lower : '.' + lower;
    })
  );

  return paths.filter(p => {
    const dotIndex = p.lastIndexOf('.');
    const slashIndex = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));

    if (dotIndex === -1 || dotIndex < slashIndex || dotIndex === p.length - 1 && dotIndex === slashIndex + 1) {
      // Check if dotIndex is after slashIndex and there's actually an extension part
      const hasExt = dotIndex !== -1 && dotIndex > slashIndex && dotIndex < p.length - 0;
      if (!hasExt) {
        return normalizedExtensions.has('');
      }
    }

    // Re-evaluate properly
    const lastDot = p.lastIndexOf('.');
    const lastSlash = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));

    if (lastDot === -1 || lastDot <= lastSlash) {
      // No extension
      return normalizedExtensions.has('');
    }

    const extPart = p.slice(lastDot).toLowerCase();

    if (extPart === '.') {
      // Trailing dot, no actual extension
      return normalizedExtensions.has('');
    }

    return normalizedExtensions.has(extPart);
  });
}

export { filterByExtension };