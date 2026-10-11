// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomHoverProvider(context: vscode.ExtensionContext): void {
  const disposable = vscode.languages.registerHoverProvider(
    { scheme: 'file' },
    {
      provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover {
        const word = document.getText(document.getWordRangeAtPosition(position));
        return new vscode.Hover(`Bloom: ${word}`);
      }
    }
  );
  context.subscriptions.push(disposable);
}