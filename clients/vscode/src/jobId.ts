// bloom-deps:

export function isValidJobId(jobId: unknown): jobId is string {
  if (typeof jobId !== 'string' || jobId.length === 0) {
    return false;
  }
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  return uuidV4Regex.test(jobId);
}