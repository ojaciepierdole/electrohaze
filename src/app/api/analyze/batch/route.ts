import { NextResponse } from 'next/server';
import { processFile } from '@/lib/process-file';
import { updateSessionState } from '@/app/api/analyze/progress/route';
import { Logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = Logger.getInstance();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const models = formData.getAll('models') as string[];
    const sessionId = uuidv4();

    if (!files.length || !models.length) {
      return NextResponse.json(
        { error: 'Brak plików lub modeli do przetworzenia' },
        { status: 400 }
      );
    }

    // Inicjalizuj stan sesji
    updateSessionState(sessionId, {
      status: 'processing',
      progress: 0
    });

    // Rozpocznij przetwarzanie w tle
    (async () => {
      try {
        const totalSteps = files.length * models.length;
        let currentStep = 0;

        for (const file of files) {
          for (const modelId of models) {
            try {
              const result = await processFile(file, file.name, modelId, sessionId);
              currentStep++;

              // Aktualizuj ogólny postęp
              const progress = Math.round((currentStep / totalSteps) * 100);
              updateSessionState(sessionId, {
                status: 'processing',
                progress
              });

            } catch (error) {
              logger.error('Błąd podczas przetwarzania pliku', {
                fileName: file.name,
                modelId,
                error
              });
            }
          }
        }

        // Zakończ przetwarzanie
        updateSessionState(sessionId, {
          status: 'success',
          progress: 100
        });

      } catch (error) {
        logger.error('Błąd podczas przetwarzania wsadowego', { error });
        updateSessionState(sessionId, {
          status: 'error',
          error: 'Wystąpił błąd podczas przetwarzania'
        });
      }
    })();

    return NextResponse.json({ sessionId });

  } catch (error) {
    logger.error('Błąd podczas obsługi żądania', { error });
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania żądania' },
      { status: 500 }
    );
  }
} 