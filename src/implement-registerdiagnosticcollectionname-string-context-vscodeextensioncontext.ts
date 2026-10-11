// bloom-deps:
import * as vscode from 'vscode';

export function registerDiagnosticCollection(
  name: string,
  context: vscode.ExtensionContext
): vscode.DiagnosticCollection {
  const collection = vscode.languages.createDiagnosticCollection(name);
  context.subscriptions.push({
    dispose: () => collection.dispose(),
  });
  return collection;
}