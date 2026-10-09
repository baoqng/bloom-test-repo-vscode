// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function createBloomLogChannel(
  context: vscode.ExtensionContext,
  channelName: string
): vscode.LogOutputChannel {
  // Validate context
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  // Validate channelName
  if (typeof channelName !== 'string') {
    throw new TypeError('channelName must be a string');
  }

  if (channelName.length === 0) {
    throw new TypeError('channelName must be a non-empty string');
  }

  // Create the log output channel with { log: true } option
  const channel = vscode.window.createOutputChannel(channelName, { log: true });

  // Push the channel into context.subscriptions for lifecycle management
  context.subscriptions.push(channel);

  // Write initial entry
  channel.info('BLOOM log channel initialized: ' + channelName);

  return channel;
}