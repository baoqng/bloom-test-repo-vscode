// bloom-deps:

export interface ChatSessionMetadataFile {
  sessionId: string;
  [key: string]: unknown;
}

export interface RepositoryProperties {
  repoRoot: string;
  [key: string]: unknown;
}

export interface RequestDetails {
  requestId: string;
  [key: string]: unknown;
}

export interface StoredModeInstructions {
  mode: string;
  instructions: string;
}

export interface WorkspaceFolderEntry {
  folderPath: string;
  timestamp: number;
}

export interface WorktreeSessionEntry {
  worktreePath: string;
  [key: string]: unknown;
}

export async function reassignSessionsToFolder(
  store: {
    getSessionIdsForFolder(folder: { fsPath: string }): string[];
    storeWorkspaceFolderInfo(sessionId: string, entry: { folderPath: string; timestamp: number }): Promise<void>;
  },
  oldFolderUri: { fsPath: string },
  newFolderUri: { fsPath: string }
): Promise<string[]> {
  const sessionIds = store.getSessionIdsForFolder(oldFolderUri);
  if (sessionIds.length === 0) {
    return [];
  }
  await Promise.all(
    sessionIds.map((sessionId) =>
      store.storeWorkspaceFolderInfo(sessionId, {
        folderPath: newFolderUri.fsPath,
        timestamp: Date.now(),
      })
    )
  );
  return sessionIds;
}