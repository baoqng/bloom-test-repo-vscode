// bloom-deps:

export function changeBadge(changeType: string, added: number, removed: number): string {
  if (changeType === 'create') {
    return 'new file';
  }
  if (changeType === 'delete') {
    return 'deleted';
  }
  if (added > 0 && removed > 0) {
    return '+' + added + ' \u2212' + removed;
  }
  if (added > 0) {
    return '+' + added;
  }
  if (removed > 0) {
    return '\u2212' + removed;
  }
  return 'no change';
}