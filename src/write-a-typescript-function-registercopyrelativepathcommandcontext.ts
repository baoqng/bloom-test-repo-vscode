// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerCopyRelativePathCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const disposable = vscode.commands.registerCommand(
    'bloom.copyRelativePath',
    async (uri?: vscode.Uri) => {
      let targetUri = uri;

      if (!targetUri) {
        targetUri = vscode.window.activeTextEditor?.document.uri;
      }

      if (!targetUri) {
        await vscode.window.showWarningMessage('No file selected');
        return;
      }

      const relativePath = vscode.workspace.asRelativePath(targetUri, false);
      await vscode.env.clipboard.writeText(relativePath);
      await vscode.window.showInformationMessage('Copied: ' + relativePath);
    }
  );

  context.subscriptions.push(disposable);
  return disposable;
}