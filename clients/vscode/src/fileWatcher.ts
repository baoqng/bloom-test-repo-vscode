// bloom-deps:
import * as vscode from 'vscode';

export function watchBloomWorkspaceFiles(
  context: vscode.ExtensionContext,
  pattern: string,
  onChange: (uri: vscode.Uri) => void
): vscode.FileSystemWatcher {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof pattern !== 'string' || pattern.length === 0) {
    throw new TypeError('pattern must be a non-empty string');
  }

  if (typeof onChange !== 'function') {
    throw new TypeError('onChange must be a function');
  }

  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  watcher.onDidCreate(onChange);
  watcher.onDidChange(onChange);

  context.subscriptions.push(watcher);

  return watcher;
}