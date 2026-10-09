// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerBloomCommand(
  context: import('vscode').ExtensionContext,
  commandId: string,
  handler: (...args: unknown[]) => unknown
): import('vscode').Disposable {
  // Input validation
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof commandId !== 'string' || commandId.length === 0) {
    throw new TypeError('commandId must be a non-empty string');
  }

  if (typeof handler !== 'function') {
    throw new TypeError('handler must be a function');
  }

  // Register the command with error handling
  const disposable = vscode.commands.registerCommand(
    commandId,
    async (...args: unknown[]) => {
      try {
        await handler(...args);
      } catch (err) {
        const errorMessage =
          'BLOOM command failed: ' +
          (err instanceof Error ? err.message : String(err));
        vscode.window.showErrorMessage(errorMessage);
      }
    }
  );

  // Push disposable to subscriptions
  context.subscriptions.push(disposable);

  // Return the disposable
  return disposable;
}