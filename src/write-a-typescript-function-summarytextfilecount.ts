// bloom-deps:

export function summaryText(fileCount: number, generatedInMs?: number): string {
  const fileLabel = fileCount === 1 ? '1 file changed' : `${fileCount} files changed`;

  if (generatedInMs !== undefined && generatedInMs > 0) {
    const seconds = Math.round(generatedInMs / 1000);
    return `${fileLabel} \u00b7 generated in ${seconds}s`;
  }

  return fileLabel;
}