import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    logger.info('Otrzymano żądanie GET /progress', { 
      sessionId,
      availableSessions: sessionStore.getAllSessionIds(),
      requestUrl: request.url
    });

    if (!sessionId) {
      logger.warn('Brak identyfikatora sesji w żądaniu');
      return NextResponse.json(
        { error: 'Brak identyfikatora sesji' },
        { status: 400 }
      );
    }

    const state = sessionStore.get(sessionId);
    if (!state) {
      logger.warn('Nie znaleziono stanu dla sesji', { 
        sessionId,
        availableSessions: sessionStore.getAllSessionIds()
      });
      return NextResponse.json(
        { error: 'Nie znaleziono stanu dla podanej sesji' },
        { status: 404 }
      );
    }

    logger.info('Stan sesji', { sessionId, state });
    return NextResponse.json(state);

  } catch (error) {
    logger.error('Błąd podczas pobierania stanu', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania stanu' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Brak ID sesji' }, { status: 400 });
  }

  try {
    const update = await request.json();
    updateSessionState(sessionId, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Błąd podczas aktualizacji stanu sesji', { sessionId, error });
    return NextResponse.json({ error: 'Błąd podczas aktualizacji' }, { status: 500 });
  }
} 