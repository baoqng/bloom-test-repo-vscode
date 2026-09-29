export function computeDiagnosticBadgeState(
  diagnostics: Array<{ severity: 0 | 1 | 2 | 3; isFromActiveFile: boolean }>
): {
  errorCount: number;
  warningCount: number;
  label: string;
  tooltip: string;
  color: 'error' | 'warning' | 'none';
} {
  // Input validation: diagnostics must be an array
  if (!Array.isArray(diagnostics)) {
    throw new TypeError('diagnostics must be an array');
  }

  // Count errors (severity 0) and warnings (severity 1)
  let errorCount = 0;
  let warningCount = 0;

  for (const diagnostic of diagnostics) {
    const severity = diagnostic.severity;

    // Validate severity is 0, 1, 2, or 3
    if (typeof severity !== 'number' || ![0, 1, 2, 3].includes(severity)) {
      throw new TypeError('diagnostic severity must be 0, 1, 2, or 3');
    }

    // Count severity 0 as errors, severity 1 as warnings
    // Ignore severity 2 (Information) and 3 (Hint)
    if (severity === 0) {
      errorCount++;
    } else if (severity === 1) {
      warningCount++;
    }
  }

  // Compute label
  let label = '';
  if (errorCount > 0 && warningCount > 0) {
    label = `$(error) ${errorCount} $(warning) ${warningCount}`;
  } else if (errorCount > 0) {
    label = `$(error) ${errorCount}`;
  } else if (warningCount > 0) {
    label = `$(warning) ${warningCount}`;
  }

  // Compute tooltip with proper pluralisation
  // When both errors and warnings are present, always use plural forms
  let tooltip = '';
  if (errorCount > 0 && warningCount > 0) {
    tooltip = `${errorCount} errors, ${warningCount} warnings`;
  } else if (errorCount > 0) {
    const errorStr = errorCount === 1 ? 'error' : 'errors';
    tooltip = `${errorCount} ${errorStr}`;
  } else if (warningCount > 0) {
    const warningStr = warningCount === 1 ? 'warning' : 'warnings';
    tooltip = `${warningCount} ${warningStr}`;
  } else {
    tooltip = 'No problems';
  }

  // Compute color
  let color: 'error' | 'warning' | 'none';
  if (errorCount > 0) {
    color = 'error';
  } else if (warningCount > 0) {
    color = 'warning';
  } else {
    color = 'none';
  }

  return {
    errorCount,
    warningCount,
    label,
    tooltip,
    color,
  };
}