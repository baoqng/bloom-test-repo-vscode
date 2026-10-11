// bloom-deps:

import * as vscode from 'vscode';

export function createStatusBarManager(
  label: string,
  context: vscode.ExtensionContext
): vscode.StatusBarItem {
  // Create status bar item with Left alignment and priority 100
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );

  // Set item text to the provided label
  item.text = label;

  // Register the item for disposal
  context.subscriptions.push({
    dispose: () => item.dispose()
  });

  // Show the status bar item
  item.show();

  // Return the created status bar item
  return item;
}