// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export async function applyBloomWorkspaceEdit(
  fileUri: vscode.Uri,
  generatedCode: string,
  insertLine: number
): Promise<boolean> {
  // Validate fileUri
  if (
    fileUri === null ||
    typeof fileUri !== 'object' ||
    typeof fileUri.fsPath !== 'string'
  ) {
    throw new TypeError(
      'fileUri must be a non-null object with a string fsPath property'
    );
  }

  // Validate generatedCode
  if (typeof generatedCode !== 'string') {
    throw new TypeError('generatedCode must be a string');
  }

  // Validate insertLine
  if (
    typeof insertLine !== 'number' ||
    !Number.isFinite(insertLine) ||
    insertLine < 0 ||
    !Number.isInteger(insertLine)
  ) {
    throw new RangeError(
      'insertLine must be a non-negative finite integer'
    );
  }

  // Create WorkspaceEdit
  const edit = new vscode.WorkspaceEdit();

  // Create Position at the specified line
  const position = new vscode.Position(insertLine, 0);

  // Insert generated code
  edit.insert(fileUri, position, generatedCode);

  // Apply edit and return result
  const result = await vscode.workspace.applyEdit(edit);
  return result;
}