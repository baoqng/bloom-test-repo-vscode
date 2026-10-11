// bloom-deps:
import * as vscode from 'vscode';

export function createDiagnosticsReporter(
  context: vscode.ExtensionContext
): (
  uri: vscode.Uri,
  results: Array<{
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>
) => number {
  const collection = vscode.languages.createDiagnosticCollection('bloom-lint');
  context.subscriptions.push(collection);

  return function report(uri, results) {
    if (results.length === 0) {
      collection.delete(uri);
      return 0;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    let errorCount = 0;

    for (const result of results) {
      if (result.line < 1) {
        throw new RangeError(
          `line must be >= 1, got ${result.line}`
        );
      }
      if (result.column < 1) {
        throw new RangeError(
          `column must be >= 1, got ${result.column}`
        );
      }
      if (result.length < 0) {
        throw new RangeError(
          `length must be >= 0, got ${result.length}`
        );
      }

      const line0 = result.line - 1;
      const col0 = result.column - 1;
      const range = new vscode.Range(line0, col0, line0, col0 + result.length);

      let severity: vscode.DiagnosticSeverity;
      if (result.severity === 'error') {
        severity = vscode.DiagnosticSeverity.Error;
        errorCount++;
      } else if (result.severity === 'warning') {
        severity = vscode.DiagnosticSeverity.Warning;
      } else {
        severity = vscode.DiagnosticSeverity.Information;
      }

      const diagnostic = new vscode.Diagnostic(range, result.message, severity);
      diagnostic.source = 'bloom-lint';

      diagnostics.push(diagnostic);
    }

    collection.set(uri, diagnostics);
    return errorCount;
  };
}