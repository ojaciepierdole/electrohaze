import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache-manager';
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

    // Pobierz wyniki z cache
    const results = cacheManager.getBySessionId(sessionId);

    if (!results) {
      return NextResponse.json(
        { error: 'Nie znaleziono wyników dla podanej sesji' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });

  } catch (error) {
    logger.error('Błąd podczas pobierania wyników', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wyników' },
      { status: 500 }
    );
  }
} 