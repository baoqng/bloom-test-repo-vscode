// bloom-deps:
import * as vscode from 'vscode';

export class BloomEditorService {
  getWordAtPosition(document: vscode.TextDocument, position: vscode.Position): string {
    if (
      document === null ||
      document === undefined ||
      typeof document !== 'object' ||
      position === null ||
      position === undefined ||
      typeof position !== 'object'
    ) {
      throw new TypeError('document and position must be valid objects');
    }

    const range = document.getWordRangeAtPosition(position);

    if (range === undefined || range === null) {
      return '';
    }

    return document.getText(range);
  }
}