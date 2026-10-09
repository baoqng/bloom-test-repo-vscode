// bloom-deps:
import * as vscode from "vscode";

export function registerBloomCodeLensProvider(
  context: import("vscode").ExtensionContext,
  commandId: string
): import("vscode").Disposable {
  if (context === null || typeof context !== "object") {
    throw new TypeError("context must be a non-null object");
  }

  if (typeof commandId !== "string" || commandId === "") {
    throw new TypeError("commandId must be a non-empty string");
  }

  const provider: vscode.CodeLensProvider = {
    provideCodeLenses(
      document: vscode.TextDocument
    ): vscode.ProviderResult<vscode.CodeLens[]> {
      const lenses: vscode.CodeLens[] = [];
      const lineCount = document.lineCount;

      for (let i = 0; i < lineCount; i++) {
        const lineText = document.lineAt(i).text;
        if (/^export\s+async\s+function\s+\w+/.test(lineText)) {
          const range = new vscode.Range(i, 0, i, 0);
          const lens = new vscode.CodeLens(range, {
            title: "Run BLOOM",
            command: commandId,
          });
          lenses.push(lens);
        }
      }

      return lenses;
    },
  };

  const disposable = vscode.languages.registerCodeLensProvider(
    [{ language: "typescript" }, { language: "javascript" }],
    provider
  );

  context.subscriptions.push(disposable);

  return disposable;
}