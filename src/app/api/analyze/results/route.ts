import { NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

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

    // Pobierz stan sesji
    const state = sessionStore.get(sessionId);
    if (!state) {
      return NextResponse.json(
        { error: 'Nie znaleziono wyników dla podanej sesji' },
        { status: 404 }
      );
    }

    // Sprawdź czy przetwarzanie zostało zakończone
    if (state.status === 'processing') {
      return NextResponse.json(
        { error: 'Przetwarzanie jest w toku' },
        { status: 202 }
      );
    }

    // Sprawdź czy wystąpił błąd
    if (state.status === 'error') {
      return NextResponse.json(
        { error: state.error || 'Wystąpił błąd podczas przetwarzania' },
        { status: 500 }
      );
    }

    // Zwróć wyniki
    if (!state.results || state.results.length === 0) {
      return NextResponse.json(
        { error: 'Nie otrzymano żadnych wyników analizy' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results: state.results });

  } catch (error) {
    logger.error('Błąd podczas pobierania wyników', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wyników' },
      { status: 500 }
    );
  }
} 