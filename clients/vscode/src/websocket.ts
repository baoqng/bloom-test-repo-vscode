// bloom-deps:

export function buildSubscribeMessage(jobId: string): string {
  if (typeof jobId !== "string" || jobId.length === 0) {
    throw new TypeError(
      "jobId must be a non\u2010empty string"
    );
  }
  return JSON.stringify({ type: "SUBSCRIBE", jobId });
}