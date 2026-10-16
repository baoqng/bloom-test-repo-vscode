// bloom-deps:

export interface UserSession {
  isExpired(): boolean;
}

export class SessionManager {
  private _activeSession: UserSession | null = null;

  getActiveSession(): UserSession | null {
    if (this._activeSession == null) {
      return null;
    }
    if (this._activeSession.isExpired()) {
      return null;
    }
    return this._activeSession;
  }

  setActiveSession(session: UserSession | null): void {
    this._activeSession = session;
  }
}