// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export async function showBloomJobPicker(
  jobs: Array<{ id: string; label: string; description: string }>
): Promise<string | undefined> {
  // Validate that jobs is an array
  if (!Array.isArray(jobs)) {
    throw new TypeError('jobs must be an array');
  }

  // Validate each element in jobs
  for (const job of jobs) {
    if (
      typeof job?.id !== 'string' ||
      job.id.length === 0 ||
      typeof job?.label !== 'string' ||
      job.label.length === 0 ||
      typeof job?.description !== 'string' ||
      job.description.length === 0
    ) {
      throw new TypeError(
        'Each job must have non-empty string fields: id, label, and description'
      );
    }
  }

  // Map jobs to QuickPickItem objects with jobId
  const items: (vscode.QuickPickItem & { jobId: string })[] = jobs.map(
    (job) => ({
      label: job.label,
      description: job.description,
      jobId: job.id,
    })
  );

  // Show the quick pick dialog
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a BLOOM job',
    matchOnDescription: true,
  });

  // Return the jobId if an item was picked, otherwise return undefined
  if (picked === undefined) {
    return undefined;
  }

  return picked.jobId;
}