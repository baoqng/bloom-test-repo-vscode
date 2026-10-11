// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function createBloomWebviewPanel(
	title: string,
	context: vscode.ExtensionContext
): vscode.WebviewPanel {
	if (typeof title !== 'string') {
		throw new TypeError('title must be a string');
	}

	if (!context || typeof context !== 'object') {
		throw new TypeError('context must be a valid ExtensionContext');
	}

	if (!Array.isArray(context.subscriptions)) {
		throw new TypeError('context.subscriptions must be an array');
	}

	const panel = vscode.window.createWebviewPanel(
		'bloomPanel',
		title,
		vscode.ViewColumn.One,
		{}
	);

	context.subscriptions.push({
		dispose: () => panel.dispose()
	});

	return panel;
}