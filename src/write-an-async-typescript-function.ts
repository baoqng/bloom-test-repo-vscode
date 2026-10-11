// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export async function insertFileHeader(document: vscode.TextDocument, header: string): Promise<boolean> {
	// Validate header is a string
	if (typeof header !== 'string') {
		throw new TypeError('header must be a string');
	}

	// Validate header is not empty after trimming
	const trimmedHeader = header.trim();
	if (trimmedHeader.length === 0) {
		throw new TypeError('header must not be empty after trimming');
	}

	// Extract first line of header
	const headerFirstLine = trimmedHeader.split('\n')[0];

	// Check if first line of document already equals header's first line
	if (document.lineCount > 0) {
		const docFirstLine = document.lineAt(0).text;
		if (docFirstLine === headerFirstLine) {
			return false;
		}
	}

	// Create workspace edit to insert header at the beginning
	const edit = new vscode.WorkspaceEdit();
	edit.insert(document.uri, new vscode.Position(0, 0), header + '\n');

	// Apply the edit and return the result
	return await vscode.workspace.applyEdit(edit);
}