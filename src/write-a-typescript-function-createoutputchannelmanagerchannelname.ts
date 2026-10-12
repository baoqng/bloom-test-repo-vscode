// bloom-deps:
import * as vscode from 'vscode';

export function createOutputChannelManager(
  channelName: string,
  context: vscode.ExtensionContext
): vscode.OutputChannel {
  const channel = vscode.window.createOutputChannel(channelName);
  context.subscriptions.push(channel);
  return channel;
}