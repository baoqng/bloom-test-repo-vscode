// bloom-deps:
import * as vscode from 'vscode';

export function createBloomStatusBarItem(
  context: vscode.ExtensionContext,
  commandId: string
): vscode.StatusBarItem {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof commandId !== 'string' || commandId.length === 0) {
    throw new TypeError('commandId must be a non-empty string');
  }

  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

  item.command = commandId;
  item.text = '$(sync~spin) BLOOM';
  item.tooltip = 'BLOOM job in progress';

  item.show();

  context.subscriptions.push(item);

  return item;
}