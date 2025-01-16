import { Logger } from '@/lib/logger';
import { sessionStore } from '@/lib/session-store';
import type { SessionState } from '@/lib/session-store';

const logger = Logger.getInstance();

export function updateSessionState(sessionId: string, update: Partial<SessionState>) {
  logger.info('Aktualizacja stanu sesji', { 
    sessionId, 
    update,
    currentSessions: sessionStore.getAllSessionIds()
  });

  sessionStore.update(sessionId, update);
} 