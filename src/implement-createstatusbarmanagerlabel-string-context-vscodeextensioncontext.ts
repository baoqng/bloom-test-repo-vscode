// bloom-deps:
import * as vscode from 'vscode';

export function createStatusBarManager(label: string, context: vscode.ExtensionContext): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.text = label;
  context.subscriptions.push({ dispose: () => item.dispose() });
  item.show();
  return item;
}