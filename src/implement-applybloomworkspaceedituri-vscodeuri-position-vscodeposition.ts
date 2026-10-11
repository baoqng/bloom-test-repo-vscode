// bloom-deps:
import * as vscode from 'vscode';

export async function applyBloomWorkspaceEdit(
  uri: vscode.Uri,
  position: vscode.Position,
  code: string
): Promise<boolean> {
  const edit = new vscode.WorkspaceEdit();
  edit.insert(uri, position, code);
  const result = await vscode.workspace.applyEdit(edit);
  return result;
}