// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function registerWordCountStatus(context: vscode.ExtensionContext): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  
  const updateWordCount = () => {
    const activeEditor = vscode.window.activeTextEditor;
    
    if (!activeEditor) {
      statusBarItem.hide();
      return;
    }
    
    statusBarItem.show();
    
    const text = activeEditor.document.getText();
    const tokens = text.trim().split(/\s+/).filter(token => token.length > 0);
    const wordCount = tokens.length;
    
    const wordLabel = wordCount === 1 ? 'word' : 'words';
    statusBarItem.text = `$(pencil) ${wordCount} ${wordLabel}`;
  };
  
  // Initial update on activation
  updateWordCount();
  
  // Subscribe to active editor changes
  const editorChangeSubscription = vscode.window.onDidChangeActiveTextEditor(() => {
    updateWordCount();
  });
  
  // Subscribe to document changes
  const documentChangeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
    const activeEditor = vscode.window.activeTextEditor;
    
    if (activeEditor && event.document === activeEditor.document) {
      updateWordCount();
    }
  });
  
  // Push all disposables into context.subscriptions
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(editorChangeSubscription);
  context.subscriptions.push(documentChangeSubscription);
  
  return statusBarItem;
}