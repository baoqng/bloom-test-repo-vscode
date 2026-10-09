// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function createBloomStatusBarItem(
  context: vscode.ExtensionContext,
  commandId: string
): vscode.StatusBarItem {
  // Input validation: context must be a non-null object
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a valid ExtensionContext object');
  }

  // Input validation: commandId must be a non-empty string
  if (typeof commandId !== 'string' || commandId.length === 0) {
    throw new TypeError('commandId must be a non-empty string');
  }

  // Create status bar item via vscode.window.createStatusBarItem
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  // Configure the status bar item
  item.command = commandId;
  item.text = '$(sync~spin) BLOOM';
  item.tooltip = 'BLOOM job in progress';

  // Show the item
  item.show();

  // Push the item (which is itself a Disposable) into context.subscriptions
  context.subscriptions.push(item);

  // Return the configured item
  return item;
}