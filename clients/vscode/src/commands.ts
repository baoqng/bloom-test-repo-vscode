// bloom-deps:
import * as vscode from 'vscode';

export function registerBloomCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  handler: (...args: unknown[]) => unknown
): vscode.Disposable {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof commandId !== 'string' || commandId === '') {
    throw new TypeError('commandId must be a non-empty string');
  }

  if (typeof handler !== 'function') {
    throw new TypeError('handler must be a function');
  }

  const disposable = vscode.commands.registerCommand(commandId, async (...args: unknown[]) => {
    try {
      await handler(...args);
    } catch (err) {
      vscode.window.showErrorMessage(
        'BLOOM command failed: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  });

  context.subscriptions.push(disposable);

  return disposable;
}