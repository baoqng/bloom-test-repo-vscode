// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function createBloomLogChannel(
  context: vscode.ExtensionContext,
  channelName: string
): vscode.LogOutputChannel {
  // Validate context
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a valid ExtensionContext object');
  }

  // Validate channelName
  if (typeof channelName !== 'string') {
    throw new TypeError('channelName must be a non-empty string');
  }

  if (channelName.length === 0) {
    throw new TypeError('channelName must be a non-empty string');
  }

  // Create the LogOutputChannel with { log: true } option
  const channel = vscode.window.createOutputChannel(channelName, { log: true }) as vscode.LogOutputChannel;

  // Push the channel into context.subscriptions
  context.subscriptions.push(channel);

  // Write initial entry
  channel.info('BLOOM log channel initialized: ' + channelName);

  return channel;
}