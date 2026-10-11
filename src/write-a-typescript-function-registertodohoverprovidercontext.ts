// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerTodoHoverProvider(context: vscode.ExtensionContext): vscode.Disposable {
  const todoPattern = /TODO\(([a-z0-9_-]+)\)/i;

  const hoverProvider = vscode.languages.registerHoverProvider(
    ['typescript', 'javascript'],
    {
      provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        const range = document.getWordRangeAtPosition(position, todoPattern);

        if (range === undefined) {
          return undefined;
        }

        const matchedText = document.getText(range);
        const match = matchedText.match(todoPattern);

        if (!match || !match[1]) {
          return undefined;
        }

        const owner = match[1];
        const markdownString = new vscode.MarkdownString('**TODO owner:** ' + owner);
        return new vscode.Hover([markdownString], range);
      }
    }
  );

  context.subscriptions.push(hoverProvider);
  return hoverProvider;
}