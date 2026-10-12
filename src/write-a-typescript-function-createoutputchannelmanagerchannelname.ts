// bloom-deps: vscode@^1

import * as vscode from 'vscode';

/**
 * Creates and registers a VS Code output channel with the given name.
 * The channel is stored in the extension context's subscriptions array
 * for proper disposal on deactivation.
 *
 * @param channelName - The name of the output channel to create
 * @param context - The extension context for managing subscriptions
 * @returns The created output channel instance
 */
export function createOutputChannelManager(
  channelName: string,
  context: vscode.ExtensionContext
): vscode.OutputChannel {
  if (typeof channelName !== 'string') {
    throw new TypeError('channelName must be a string');
  }

  if (!context || typeof context !== 'object') {
    throw new TypeError('context must be a valid VS Code ExtensionContext');
  }

  if (!Array.isArray(context.subscriptions)) {
    throw new TypeError('context.subscriptions must be an array');
  }

  const channel = vscode.window.createOutputChannel(channelName);

  context.subscriptions.push(channel);

  return channel;
}