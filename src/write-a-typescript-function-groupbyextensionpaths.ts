// bloom-deps:

function groupByExtension(paths: string[]): Map<string, string[]> {
  if (!Array.isArray(paths)) {
    throw new TypeError('paths must be an array');
  }

  const result = new Map<string, string[]>();

  for (const filePath of paths) {
    const segments = filePath.split('/');
    const filename = segments[segments.length - 1];

    let ext = '';
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex > 0) {
      ext = filename.slice(dotIndex).toLowerCase();
    }

    if (!result.has(ext)) {
      result.set(ext, []);
    }
    result.get(ext)!.push(filePath);
  }

  return result;
}

export { groupByExtension };