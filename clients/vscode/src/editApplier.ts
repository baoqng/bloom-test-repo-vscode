// bloom-deps:

import * as vscode from 'vscode';

export async function applyBloomWorkspaceEdit(
  fileUri: import('vscode').Uri,
  generatedCode: string,
  insertLine: number
): Promise<boolean> {
  // Validate fileUri
  if (fileUri === null || typeof fileUri !== 'object') {
    throw new TypeError('fileUri must be a non-null object');
  }
  if (typeof fileUri.fsPath !== 'string') {
    throw new TypeError('fileUri must have a fsPath property that is a string');
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
    throw new RangeError('insertLine must be a non-negative safe integer');
  }

  // Create workspace edit
  const edit = new vscode.WorkspaceEdit();

  // Create position at the specified line, column 0
  const position = new vscode.Position(insertLine, 0);

  // Insert the generated code with a newline
  edit.insert(fileUri, position, generatedCode + '\n');

  // Apply the edit and return the result
  const success = await vscode.workspace.applyEdit(edit);
  return success;
}