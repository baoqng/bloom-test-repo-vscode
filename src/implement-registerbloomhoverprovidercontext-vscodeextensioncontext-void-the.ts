// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerBloomHoverProvider(context: vscode.ExtensionContext): void {
	const disposable = vscode.languages.registerHoverProvider(
		{ scheme: 'file' },
		{
			provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
				const wordRange = document.getWordRangeAtPosition(position);
				if (!wordRange) {
					return undefined;
				}
				const word = document.getText(wordRange);
				return new vscode.Hover(`Bloom: ${word}`);
			}
		}
	);
	context.subscriptions.push(disposable);
}