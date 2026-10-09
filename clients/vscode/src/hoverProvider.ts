// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomHoverProvider(
  context: vscode.ExtensionContext,
  getJobStatus: (functionName: string) => Promise<string | null>
): vscode.Disposable {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof getJobStatus !== 'function') {
    throw new TypeError('getJobStatus must be a function');
  }

  const provider: vscode.HoverProvider = {
    async provideHover(
      document: vscode.TextDocument,
      position: vscode.Position
    ): Promise<vscode.Hover | null> {
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) {
        return null;
      }

      const word = document.getText(wordRange);
      const status = await getJobStatus(word);

      if (status === null) {
        return null;
      }

      const markdown = new vscode.MarkdownString('**BLOOM:** ' + status);
      return new vscode.Hover([markdown]);
    }
  };

  const disposable = vscode.languages.registerHoverProvider(
    [{ language: 'typescript' }, { language: 'javascript' }],
    provider
  );

  context.subscriptions.push(disposable);

  return disposable;
}