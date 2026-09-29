// bloom-deps:

export function buildProblemsFilterPredicate(
  filter: {
    severities: Array<'error' | 'warning' | 'info' | 'hint'>;
    activeFileOnly: boolean;
    activeFileUri: string | null;
    textFilter: string;
  }
): (diagnostic: {
  severity: 'error' | 'warning' | 'info' | 'hint';
  fileUri: string;
  message: string;
  source: string | null;
}) => boolean {
  if (filter === null || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new TypeError('filter must be a non-null object');
  }

  if (!Array.isArray(filter.severities)) {
    throw new TypeError('filter.severities must be an array');
  }

  if (typeof filter.textFilter !== 'string') {
    throw new TypeError('filter.textFilter must be a string');
  }

  const severities = filter.severities;
  const activeFileOnly = filter.activeFileOnly;
  const activeFileUri = filter.activeFileUri;
  const trimmedTextFilter = filter.textFilter.trim();

  return (diagnostic) => {
    try {
      // (1) Severity check
      if (severities.length > 0) {
        if (!severities.includes(diagnostic.severity)) {
          return false;
        }
      }

      // (2) Active file check
      if (activeFileOnly && activeFileUri !== null && activeFileUri !== '') {
        if (diagnostic.fileUri !== activeFileUri) {
          return false;
        }
      }

      // (3) Text filter check
      if (trimmedTextFilter !== '') {
        const lowerFilter = trimmedTextFilter.toLowerCase();
        const messageMatches = diagnostic.message.toLowerCase().includes(lowerFilter);
        if (!messageMatches) {
          if (diagnostic.source === null) {
            return false;
          }
          const sourceMatches = diagnostic.source.toLowerCase().includes(lowerFilter);
          if (!sourceMatches) {
            return false;
          }
        }
      }

      return true;
    } catch {
      return false;
    }
  };
}