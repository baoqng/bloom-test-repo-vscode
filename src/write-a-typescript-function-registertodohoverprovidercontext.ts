// bloom-deps:
import * as vscode from 'vscode';

export function registerTodoHoverProvider(context: vscode.ExtensionContext): vscode.Disposable {
  const registration = vscode.languages.registerHoverProvider(
    ['typescript', 'javascript'],
    {
      provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
      ): vscode.Hover | undefined {
        const range = document.getWordRangeAtPosition(position, /TODO\(([a-z0-9_-]+)\)/i);
        if (range === undefined) {
          return undefined;
        }
        const matchedText = document.getText(range);
        const match = matchedText.match(/TODO\(([a-z0-9_-]+)\)/i);
        const owner = match ? match[1] : '';
        return new vscode.Hover(
          [new vscode.MarkdownString('**TODO owner:** ' + owner)],
          range
        );
      }
    }
  );

  context.subscriptions.push(registration);
  return registration;
}