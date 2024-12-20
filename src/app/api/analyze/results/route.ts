import { NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';
import { cacheManager } from '@/lib/cache-manager';

const logger = Logger.getInstance();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Brak ID sesji' }, { status: 400 });
    }

    // Pobierz wyniki z cache
    const results = cacheManager.getBySessionId(sessionId);
    
    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Brak wyników dla podanej sesji' }, { status: 404 });
    }

    logger.info('Pobrano wyniki analizy', { sessionId, resultsCount: results.length });
    
    return NextResponse.json({ results });
  } catch (error) {
    logger.error('Błąd podczas pobierania wyników', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wyników' },
      { status: 500 }
    );
  }
} 