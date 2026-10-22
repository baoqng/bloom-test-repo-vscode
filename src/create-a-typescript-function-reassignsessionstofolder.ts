// bloom-deps:

export function reassignSessionsToFolder(
  sessions: ReadonlyArray<{ id: string; folderUri: string }>,
  oldFolderUri: string,
  newFolderUri: string
): Array<{ id: string; folderUri: string }> {
  if (oldFolderUri === '') {
    throw new TypeError('oldFolderUri must not be an empty string');
  }

  return sessions.map((session) => {
    if (session.folderUri === oldFolderUri) {
      return {
        id: session.id,
        folderUri: newFolderUri,
      };
    }
    return {
      id: session.id,
      folderUri: session.folderUri,
    };
  });
}