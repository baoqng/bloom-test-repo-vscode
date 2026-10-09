// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerBloomCodeLensProvider(
  context: import('vscode').ExtensionContext,
  commandId: string
): import('vscode').Disposable {
  // Input validation
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof commandId !== 'string' || commandId.length === 0) {
    throw new TypeError('commandId must be a non-empty string');
  }

  // Create the provider object
  const provider: vscode.CodeLensProvider = {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const codeLenses: vscode.CodeLens[] = [];
      const exportAsyncFunctionPattern = /^export\s+async\s+function\s+\w+/;

      for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;

        if (exportAsyncFunctionPattern.test(lineText)) {
          const range = new vscode.Range(i, 0, i, 0);
          const codeLens = new vscode.CodeLens(range, {
            title: 'Run BLOOM',
            command: commandId,
            arguments: [document.uri, i],
          });
          codeLenses.push(codeLens);
        }
      }

      return codeLenses;
    },
  };

  // Register the provider
  const disposable = vscode.languages.registerCodeLensProvider(
    { language: 'typescript' },
    provider
  );

  // Push to subscriptions
  context.subscriptions.push(disposable);

  // Return the disposable
  return disposable;
}