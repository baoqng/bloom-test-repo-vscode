// bloom-deps:
import * as vscode from 'vscode';

export function createBloomLogChannel(
  context: vscode.ExtensionContext,
  channelName: string
): vscode.LogOutputChannel {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof channelName !== 'string' || channelName.length === 0) {
    throw new TypeError('channelName must be a non-empty string');
  }

  const channel = vscode.window.createOutputChannel(channelName, { log: true }) as vscode.LogOutputChannel;

  context.subscriptions.push(channel);

  channel.info('BLOOM log channel initialized: ' + channelName);

  return channel;
}