// bloom-deps:

function reassignSessionsToFolder(
  sessions: ReadonlyArray<{ id: string; folderUri: string }>,
  oldFolderUri: string,
  newFolderUri: string
): Array<{ id: string; folderUri: string }> {
  if (oldFolderUri === '') {
    throw new TypeError('oldFolderUri must not be an empty string');
  }

  return sessions.map(session =>
    session.folderUri === oldFolderUri
      ? { id: session.id, folderUri: newFolderUri }
      : { id: session.id, folderUri: session.folderUri }
  );
}

export { reassignSessionsToFolder };