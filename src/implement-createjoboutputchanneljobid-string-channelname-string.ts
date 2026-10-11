// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export function createJobOutputChannel(
  jobId: string,
  channelName: string,
  context: vscode.ExtensionContext
): vscode.OutputChannel {
  if (typeof jobId !== 'string') {
    throw new TypeError('jobId must be a string');
  }
  if (typeof channelName !== 'string') {
    throw new TypeError('channelName must be a string');
  }
  if (!context || typeof context !== 'object') {
    throw new TypeError('context must be a valid ExtensionContext');
  }

  const channel = vscode.window.createOutputChannel(channelName);

  context.subscriptions.push({
    dispose: () => channel.dispose()
  });

  return channel;
}