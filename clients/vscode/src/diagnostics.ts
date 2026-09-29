// bloom-deps:
import * as vscode from 'vscode';

export function registerJobDiagnostics(
  context: import('vscode').ExtensionContext
): {
  set: (fileUri: import('vscode').Uri, diagnostics: import('vscode').Diagnostic[]) => void;
  clear: (fileUri: import('vscode').Uri) => void;
  dispose: () => void;
} {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  const collection = vscode.languages.createDiagnosticCollection('bloom');

  context.subscriptions.push({ dispose: () => collection.dispose() });

  return {
    set(fileUri: import('vscode').Uri, diagnostics: import('vscode').Diagnostic[]): void {
      collection.set(fileUri, diagnostics);
    },
    clear(fileUri: import('vscode').Uri): void {
      collection.delete(fileUri);
    },
    dispose(): void {
      collection.dispose();
    },
  };
}