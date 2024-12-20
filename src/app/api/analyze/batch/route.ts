import { NextResponse } from 'next/server';
import { processFile } from '@/lib/process-file';
import { updateSessionState } from '@/app/api/analyze/progress/route';
import { sessionStore } from '@/lib/session-store';
import { Logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = Logger.getInstance();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const modelId = formData.get('models[]') as string;

    logger.info('Otrzymane dane:', {
      filesCount: files.length,
      fileNames: files.map(f => f.name),
      modelId,
      formDataKeys: Array.from(formData.keys())
    });

    if (!files.length || !modelId) {
      logger.error('Brak wymaganych danych:', {
        hasFiles: files.length > 0,
        modelId
      });
      return NextResponse.json(
        { error: 'Brak plików lub modelu do przetworzenia' },
        { status: 400 }
      );
    }

    // Inicjalizuj stan sesji
    const sessionId = uuidv4();
    logger.info('Inicjalizacja sesji:', { sessionId });
    
    // Ustaw początkowy stan
    sessionStore.set(sessionId, {
      status: 'processing',
      progress: 0,
      error: null,
      results: []
    });

    // Sprawdź, czy sesja została poprawnie zainicjalizowana
    const initialState = sessionStore.get(sessionId);
    logger.info('Stan początkowy sesji:', { 
      sessionId, 
      initialState,
      availableSessions: sessionStore.getAllSessionIds()
    });

    if (!initialState) {
      logger.error('Nie udało się zainicjalizować sesji', { sessionId });
      return NextResponse.json(
        { error: 'Błąd inicjalizacji sesji' },
        { status: 500 }
      );
    }

    // Zwróć ID sesji przed rozpoczęciem przetwarzania
    const response = NextResponse.json({ sessionId });

    // Rozpocznij przetwarzanie w tle
    (async () => {
      try {
        const totalSteps = files.length;
        let currentStep = 0;
        const results = [];

        for (const file of files) {
          try {
            // Aktualizuj stan przed rozpoczęciem przetwarzania pliku
            updateSessionState(sessionId, {
              status: 'processing',
              progress: Math.round((currentStep / totalSteps) * 100)
            });

            const result = await processFile(file, file.name, modelId, sessionId);
            results.push(result);
            currentStep++;

            // Aktualizuj ogólny postęp po przetworzeniu pliku
            updateSessionState(sessionId, {
              status: 'processing',
              progress: Math.round((currentStep / totalSteps) * 100),
              results: results
            });

          } catch (error) {
            logger.error('Błąd podczas przetwarzania pliku', {
              fileName: file.name,
              modelId,
              error
            });
          }
        }

        // Zakończ przetwarzanie
        updateSessionState(sessionId, {
          status: 'success',
          progress: 100,
          results: results
        });

      } catch (error) {
        logger.error('Błąd podczas przetwarzania wsadowego', { error });
        updateSessionState(sessionId, {
          status: 'error',
          error: 'Wystąpił błąd podczas przetwarzania',
          results: []
        });
      }
    })();

    return response;

  } catch (error) {
    logger.error('Błąd podczas obsługi żądania', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania żądania' },
      { status: 500 }
    );
  }
} 