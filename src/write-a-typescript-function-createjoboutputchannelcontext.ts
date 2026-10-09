// bloom-deps:
import * as vscode from 'vscode';

export function createJobOutputChannel(
  context: vscode.ExtensionContext,
  jobId: string,
  requirement: string
): vscode.OutputChannel {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  if (typeof jobId !== 'string' || jobId.length === 0) {
    throw new TypeError('jobId must be a non-empty string');
  }

  if (typeof requirement !== 'string') {
    throw new TypeError('requirement must be a string');
  }

  const truncated = requirement.slice(0, 40).replace(/\n/g, ' ');
  const name = 'BLOOM: ' + truncated;

  const channel = vscode.window.createOutputChannel(name);

  context.subscriptions.push(channel.dispose);

  channel.appendLine('Job ' + jobId + ' started');

  channel.show(true);

  return channel;
}