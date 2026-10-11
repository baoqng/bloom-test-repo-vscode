// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerBloomFileSystemWatcher(
  pattern: string,
  context: vscode.ExtensionContext
): vscode.FileSystemWatcher {
  if (typeof pattern !== 'string') {
    throw new TypeError('pattern must be a string');
  }
  if (!context || typeof context.subscriptions === 'undefined') {
    throw new TypeError('context must be a valid vscode.ExtensionContext');
  }

  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  context.subscriptions.push(watcher);
  return watcher;
}