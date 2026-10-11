// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomCompletionProvider(context: vscode.ExtensionContext): void {
  const completionItem = new vscode.CompletionItem('bloom', vscode.CompletionItemKind.Keyword);
  
  const disposable = vscode.languages.registerCompletionItemProvider(
    { language: 'typescript' },
    {
      provideCompletionItems() {
        return [completionItem];
      }
    }
  );

  context.subscriptions.push(disposable);
}