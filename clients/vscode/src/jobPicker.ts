// bloom-deps: vscode@^1
import * as vscode from 'vscode';

type JobQuickPickItem = vscode.QuickPickItem & { jobId: string };

export async function showBloomJobPicker(
  jobs: Array<{ id: string; label: string; description: string }>
): Promise<string | undefined> {
  if (!Array.isArray(jobs)) {
    throw new TypeError('jobs must be an array');
  }

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (
      job === null ||
      job === undefined ||
      typeof job !== 'object' ||
      typeof job.id !== 'string' ||
      job.id.length === 0 ||
      typeof job.label !== 'string' ||
      job.label.length === 0 ||
      typeof job.description !== 'string' ||
      job.description.length === 0
    ) {
      throw new TypeError(
        `jobs[${i}] must have non-empty string fields: id, label, and description`
      );
    }
  }

  const items: JobQuickPickItem[] = jobs.map((job) => ({
    label: job.label,
    description: job.description,
    jobId: job.id,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a BLOOM job',
    matchOnDescription: true,
  });

  if (picked === undefined) {
    return undefined;
  }

  return picked.jobId;
}