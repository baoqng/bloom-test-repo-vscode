// bloom-deps:

export function formatRelativeTime(completedAt: number, now?: number): string {
  if (!Number.isFinite(completedAt)) {
    throw new TypeError(`completedAt must be a finite number, got ${completedAt}`);
  }

  const currentTime = now !== undefined ? now : Date.now();
  const diffMs = currentTime - completedAt;

  if (diffMs < 0) {
    return 'just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return 'just now';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? `${diffMinutes} minute ago` : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return diffHours === 1 ? `${diffHours} hour ago` : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return diffDays === 1 ? `${diffDays} day ago` : `${diffDays} days ago`;
}