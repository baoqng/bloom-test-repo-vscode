// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomCodeLensProvider(
  context: vscode.ExtensionContext,
  commandId: string
): vscode.Disposable {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof commandId !== 'string' || commandId === '') {
    throw new TypeError('commandId must be a non-empty string');
  }

  const pattern = /^export\s+async\s+function\s+\w+/;

  const provider: vscode.CodeLensProvider = {
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const lenses: vscode.CodeLens[] = [];

      for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        if (pattern.test(lineText)) {
          const range = new vscode.Range(i, 0, i, 0);
          const lens = new vscode.CodeLens(range, {
            title: 'Run BLOOM',
            command: commandId,
            arguments: [document.uri, i],
          });
          lenses.push(lens);
        }
      }

      return lenses;
    },
  };

  const disposable = vscode.languages.registerCodeLensProvider(
    { language: 'typescript' },
    provider
  );

  context.subscriptions.push(disposable);

  return disposable;
}