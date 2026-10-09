// bloom-deps:
import * as vscode from "vscode";

export async function applyBloomWorkspaceEdit(
  fileUri: import("vscode").Uri,
  generatedCode: string,
  insertLine: number
): Promise<boolean> {
  if (
    fileUri === null ||
    typeof fileUri !== "object" ||
    typeof (fileUri as any).fsPath !== "string"
  ) {
    throw new TypeError(
      "fileUri must be a non-null object with a string fsPath property"
    );
  }

  if (typeof generatedCode !== "string") {
    throw new TypeError("generatedCode must be a string");
  }

  if (
    typeof insertLine !== "number" ||
    !Number.isFinite(insertLine) ||
    !Number.isInteger(insertLine) ||
    insertLine < 0
  ) {
    throw new RangeError(
      "insertLine must be a non-negative finite integer"
    );
  }

  const edit = new vscode.WorkspaceEdit();
  const position = new vscode.Position(insertLine, 0);
  edit.insert(fileUri, position, generatedCode);

  return vscode.workspace.applyEdit(edit);
}