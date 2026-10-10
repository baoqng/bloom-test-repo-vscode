// bloom-deps:
import * as vscode from 'vscode';

interface ExtensionContext {
  subscriptions: { dispose(): void }[];
}

let context: ExtensionContext;

export function setContext(ctx: ExtensionContext): void {
  context = ctx;
}

export function createJobOutputChannel(jobId: string, channelName: string): vscode.OutputChannel {
  const channel = vscode.window.createOutputChannel(channelName);
  context.subscriptions.push({
    dispose: () => channel.dispose()
  });
  return channel;
}