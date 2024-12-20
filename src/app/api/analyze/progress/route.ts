import { NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

interface SessionState {
  status: 'processing' | 'success' | 'error';
  progress: number;
  error?: string | null;
}

const sessions = new Map<string, SessionState>();

export function updateSessionState(sessionId: string, update: Partial<SessionState>) {
  const currentState = sessions.get(sessionId) || {
    status: 'processing',
    progress: 0,
    error: null
  };

  if (update.progress !== undefined && update.progress < currentState.progress) {
    update.progress = currentState.progress;
  }

  sessions.set(sessionId, { ...currentState, ...update });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Brak identyfikatora sesji' },
        { status: 400 }
      );
    }

    const state = sessions.get(sessionId);
    if (!state) {
      return NextResponse.json(
        { error: 'Nie znaleziono stanu dla podanej sesji' },
        { status: 404 }
      );
    }

    return NextResponse.json(state);

  } catch (error) {
    logger.error('Błąd podczas pobierania stanu', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania stanu' },
      { status: 500 }
    );
  }
}

// Dodaj endpoint do aktualizacji postępu
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