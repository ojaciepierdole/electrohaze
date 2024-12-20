import { NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

// Stan dla każdej sesji
interface SessionState {
  progress: number;
  results: any[];
  error: string | null;
  lastUpdate: number;
  status: 'idle' | 'processing' | 'success' | 'error';
}

const sessions = new Map<string, SessionState>();

// Funkcja do aktualizacji stanu sesji
export function updateSessionState(sessionId: string, update: Partial<SessionState>) {
  const currentState = sessions.get(sessionId) || {
    progress: 0,
    results: [],
    error: null,
    lastUpdate: Date.now(),
    status: 'idle'
  };

  sessions.set(sessionId, {
    ...currentState,
    ...update,
    lastUpdate: Date.now()
  });
}

// Funkcja do czyszczenia starych sesji (starszych niż 5 minut)
function cleanupSessions() {
  const now = Date.now();
  const TIMEOUT = 5 * 60 * 1000; // 5 minut

  for (const [sessionId, state] of sessions.entries()) {
    if (now - state.lastUpdate > TIMEOUT) {
      sessions.delete(sessionId);
    }
  }
}

// Uruchom czyszczenie co minutę
setInterval(cleanupSessions, 60 * 1000);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Brak ID sesji' }, { status: 400 });
  }

  const sessionState = sessions.get(sessionId);
  if (!sessionState) {
    return NextResponse.json({ error: 'Sesja nie istnieje' }, { status: 404 });
  }

  return NextResponse.json(sessionState);
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