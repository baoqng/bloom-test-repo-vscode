// bloom-deps:
import * as vscode from 'vscode';

export async function runWithProgress<T>(
  title: string,
  steps: Array<() => Promise<T>>
): Promise<T[] | undefined> {
  if (typeof title !== 'string' || title === '') {
    throw new TypeError('title must be a non-empty string');
  }
  if (!Array.isArray(steps)) {
    throw new TypeError('steps must be an array');
  }

  if (steps.length === 0) {
    return [];
  }

  return vscode.window.withProgress<T[] | undefined>(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true,
    },
    async (progress, token) => {
      const results: T[] = [];
      const increment = 100 / steps.length;

      for (let i = 0; i < steps.length; i++) {
        if (token.isCancellationRequested) {
          return undefined;
        }

        const result = await steps[i]();
        results.push(result);

        progress.report({
          increment,
          message: `Step ${i + 1}/${steps.length}`,
        });
      }

      return results;
    }
  );
}