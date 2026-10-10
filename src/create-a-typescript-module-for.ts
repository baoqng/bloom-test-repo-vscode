// bloom-deps:
import * as vscode from 'vscode';

export interface CommandRegistry {
  register(commandId: string, handler: (...args: unknown[]) => unknown): void;
  unregister(commandId: string): boolean;
  has(commandId: string): boolean;
  registeredCommands(): string[];
}

export function createCommandRegistry(context: vscode.ExtensionContext): CommandRegistry {
  const registrations = new Map<string, vscode.Disposable>();

  function validateCommandId(commandId: unknown): asserts commandId is string {
    if (typeof commandId !== 'string') {
      throw new TypeError('commandId must be a non-empty string');
    }
    if (commandId === '') {
      throw new TypeError('commandId must be a non-empty string');
    }
  }

  function validateHandler(handler: unknown): asserts handler is (...args: unknown[]) => unknown {
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
  }

  return {
    register(commandId: string, handler: (...args: unknown[]) => unknown): void {
      validateCommandId(commandId);
      validateHandler(handler);

      if (registrations.has(commandId)) {
        throw new Error(`Command '${commandId}' is already registered`);
      }

      const disposable = vscode.commands.registerCommand(commandId, handler);
      registrations.set(commandId, disposable);
      context.subscriptions.push(disposable);
    },

    unregister(commandId: string): boolean {
      validateCommandId(commandId);

      const disposable = registrations.get(commandId);
      if (!disposable) {
        return false;
      }

      disposable.dispose();
      registrations.delete(commandId);

      const index = context.subscriptions.indexOf(disposable);
      if (index !== -1) {
        context.subscriptions.splice(index, 1);
      }

      return true;
    },

    has(commandId: string): boolean {
      validateCommandId(commandId);
      return registrations.has(commandId);
    },

    registeredCommands(): string[] {
      return Array.from(registrations.keys()).sort();
    },
  };
}