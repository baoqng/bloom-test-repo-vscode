// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerDiagnosticCollection(
  name: string,
  context: vscode.ExtensionContext
): vscode.DiagnosticCollection {
  if (typeof name !== 'string') {
    throw new TypeError('name must be a string');
  }

  if (!context || typeof context.subscriptions === 'undefined') {
    throw new TypeError('context must be a valid vscode.ExtensionContext');
  }

  const collection = vscode.languages.createDiagnosticCollection(name);

  context.subscriptions.push({
    dispose: () => collection.dispose()
  });

  return collection;
}