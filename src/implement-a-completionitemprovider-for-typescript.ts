// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new KeywordCompletionItemProvider();
  
  const disposable = vscode.languages.registerCompletionItemProvider(
    'typescript',
    provider
  );
  
  context.subscriptions.push(disposable);
}

export function deactivate(): void {}

class KeywordCompletionItemProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const keywords = ['const', 'let', 'var'];
    
    return keywords.map((keyword) => {
      const item = new vscode.CompletionItem(
        keyword,
        vscode.CompletionItemKind.Keyword
      );
      item.detail = `Keyword: ${keyword}`;
      return item;
    });
  }
}