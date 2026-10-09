// bloom-deps: vscode@^1

import * as vscode from 'vscode';

export async function showBloomJobPicker(
  jobs: Array<{ id: string; label: string; description: string }>
): Promise<string | undefined> {
  // Validate jobs is an array
  if (!Array.isArray(jobs)) {
    throw new TypeError('jobs must be an array');
  }

  // Validate each element has id, label, and description as non-empty strings
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    if (typeof job !== 'object' || job === null) {
      throw new TypeError(
        `jobs[${i}] must be an object with id, label, and description`
      );
    }

    if (
      typeof job.id !== 'string' ||
      job.id.length === 0
    ) {
      throw new TypeError(
        `jobs[${i}].id must be a non-empty string`
      );
    }

    if (
      typeof job.label !== 'string' ||
      job.label.length === 0
    ) {
      throw new TypeError(
        `jobs[${i}].label must be a non-empty string`
      );
    }

    if (
      typeof job.description !== 'string' ||
      job.description.length === 0
    ) {
      throw new TypeError(
        `jobs[${i}].description must be a non-empty string`
      );
    }
  }

  // Map jobs to QuickPickItem objects with jobId
  const items: Array<vscode.QuickPickItem & { jobId: string }> = jobs.map(
    (job) => ({
      label: job.label,
      description: job.description,
      jobId: job.id,
    })
  );

  // Show quick pick and get user selection
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a BLOOM job',
    matchOnDescription: true,
  });

  // Return jobId if picked, undefined if dismissed
  if (picked === undefined) {
    return undefined;
  }

  return picked.jobId;
}