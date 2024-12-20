import { Logger } from '@/lib/logger';
import { ProcessingResult } from '@/types/processing';

const logger = Logger.getInstance();

export interface SessionState {
  status: 'processing' | 'success' | 'error';
  progress: number;
  error?: string | null;
  results?: ProcessingResult[];
}

// Globalna zmienna przechowująca stan sesji
declare global {
  var __sessions: Map<string, SessionState>;
}

if (!global.__sessions) {
  global.__sessions = new Map();
}

class SessionStore {
  private static instance: SessionStore;

  private constructor() {}

  public static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  public get(sessionId: string): SessionState | undefined {
    return global.__sessions.get(sessionId);
  }

  public set(sessionId: string, state: SessionState): void {
    global.__sessions.set(sessionId, state);
    logger.info('Ustawiono stan sesji', { 
      sessionId, 
      state,
      availableSessions: Array.from(global.__sessions.keys())
    });
  }

  public update(sessionId: string, update: Partial<SessionState>): void {
    const currentState = global.__sessions.get(sessionId) || {
      status: 'processing',
      progress: 0,
      error: null,
      results: []
    };

    if (update.progress !== undefined && update.progress < currentState.progress) {
      update.progress = currentState.progress;
    }

    const newState = { ...currentState, ...update };
    global.__sessions.set(sessionId, newState);

    logger.info('Zaktualizowano stan sesji', { 
      sessionId, 
      newState,
      availableSessions: Array.from(global.__sessions.keys())
    });
  }

  public getAllSessionIds(): string[] {
    return Array.from(global.__sessions.keys());
  }
}

export const sessionStore = SessionStore.getInstance(); 