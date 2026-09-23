// bloom-deps:

export function validateManifest(manifest: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check manifest.name: must be a non-empty string
  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    errors.push('name must be a non-empty string');
  }

  // Check manifest.version: must match /^\d+\.\d+\.\d+$/ exactly (no pre-release or build metadata)
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (typeof manifest.version !== 'string' || !versionRegex.test(manifest.version)) {
    errors.push('version must match x.y.z');
  }

  // Check manifest.engines: must be an object with a non-empty string at key 'vscode'
  const engines = manifest.engines;
  if (
    engines === null ||
    engines === undefined ||
    typeof engines !== 'object' ||
    Array.isArray(engines) ||
    typeof (engines as Record<string, unknown>)['vscode'] !== 'string' ||
    ((engines as Record<string, unknown>)['vscode'] as string).length === 0
  ) {
    errors.push('engines.vscode must be a non-empty string');
  }

  if (errors.length === 0) {
    return { valid: true, errors: [] };
  }

  return { valid: false, errors };
}