// bloom-deps:
import * as vscode from 'vscode';

export function createOutputChannelManager(channelName: string): {
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
  show(preserveFocus?: boolean): void;
  clear(): void;
  dispose(): void;
  readonly isDisposed: boolean;
} {
  if (typeof channelName !== 'string' || channelName.length === 0) {
    throw new TypeError('channelName must be a non-empty string');
  }

  const channel = vscode.window.createOutputChannel(channelName);
  let disposed = false;

  function assertNotDisposed(): void {
    if (disposed) {
      throw new Error('Channel is disposed');
    }
  }

  return {
    log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
      assertNotDisposed();
      let prefix: string;
      switch (level) {
        case 'warn':
          prefix = '[WARN] ';
          break;
        case 'error':
          prefix = '[ERROR] ';
          break;
        case 'info':
        default:
          prefix = '[INFO] ';
          break;
      }
      channel.appendLine(`${prefix}${message}`);
    },

    show(preserveFocus?: boolean): void {
      assertNotDisposed();
      channel.show(preserveFocus);
    },

    clear(): void {
      assertNotDisposed();
      channel.clear();
    },

    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      channel.dispose();
    },

    get isDisposed(): boolean {
      return disposed;
    },
  };
}