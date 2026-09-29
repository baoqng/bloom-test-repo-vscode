// bloom-deps:

import * as vscode from 'vscode';

export function createJobOutputChannel(
  context: vscode.ExtensionContext,
  jobId: string,
  requirement: string
): vscode.OutputChannel {
  // Input validation guards
  if (typeof jobId !== 'string' || jobId.length === 0) {
    throw new TypeError('jobId must be a non-empty string');
  }

  if (typeof requirement !== 'string') {
    throw new TypeError('requirement must be a string');
  }

  if (context === null || typeof context !== 'object') {
    throw new TypeError('context must be a non-null object');
  }

  // Build channel name: truncate requirement to 40 chars and replace newlines with spaces
  const truncatedRequirement = requirement.slice(0, 40).replace(/\n/g, ' ');
  const channelName = 'BLOOM: ' + truncatedRequirement;

  // Create the output channel
  const channel = vscode.window.createOutputChannel(channelName);

  // Register disposal on extension deactivation
  context.subscriptions.push(channel);

  // Write initial line
  channel.appendLine('Job ' + jobId + ' started');

  // Show the channel without stealing focus (preserveFocus=true)
  channel.show(true);

  return channel;
}