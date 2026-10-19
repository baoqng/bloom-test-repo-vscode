// bloom-deps:
import * as vscode from 'vscode';

export function getEditorLanguage(): string | null {
    return vscode.window.activeTextEditor?.document.languageId ?? null;
}