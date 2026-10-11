// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomCompletionProvider(context: vscode.ExtensionContext): vscode.Disposable {
  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(
      _document: vscode.TextDocument,
      _position: vscode.Position,
      _token: vscode.CancellationToken,
      _context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
      const item = new vscode.CompletionItem('bloom', vscode.CompletionItemKind.Text);
      return [item];
    }
  };

  const disposable = vscode.languages.registerCompletionItemProvider('*', provider);
  context.subscriptions.push(disposable);
  return disposable;
}