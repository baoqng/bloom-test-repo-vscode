// bloom-deps:
import * as vscode from 'vscode';

export function registerConfigWatcher(
  context: vscode.ExtensionContext,
  onChange: (maxItems: number) => void
): vscode.Disposable {
  if (context === null || context === undefined) {
    throw new TypeError('context must not be null or undefined');
  }
  if (typeof context !== 'object') {
    throw new TypeError('context must be a vscode.ExtensionContext object');
  }
  if (onChange === null || onChange === undefined) {
    throw new TypeError('onChange must not be null or undefined');
  }
  if (typeof onChange !== 'function') {
    throw new TypeError('onChange must be a function');
  }

  const subscription = vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
    if (!event.affectsConfiguration('bloom.maxItems')) {
      return;
    }

    const value = vscode.workspace.getConfiguration('bloom').get<number>('maxItems', 50);

    const isValid =
      typeof value === 'number' &&
      Number.isFinite(value) &&
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 1000;

    if (!isValid) {
      vscode.window.showErrorMessage('bloom.maxItems must be an integer between 1 and 1000');
      return;
    }

    onChange(value);
  });

  context.subscriptions.push(subscription);

  return subscription;
}