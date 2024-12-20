import { NextResponse } from 'next/server';
import { processFile } from '@/lib/process-file';
import { Logger } from '@/lib/logger';
import { updateSessionState } from '../progress/route';
import { cacheManager } from '@/lib/cache-manager';

const logger = Logger.getInstance();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const models = formData.getAll('models') as string[];
    
    if (!files.length || !models.length) {
      return NextResponse.json(
        { error: 'Brak plików lub modeli' },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    logger.info('Rozpoczynam przetwarzanie wsadowe', {
      sessionId,
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      models,
      totalSize
    });

    // Inicjalizuj stan sesji
    updateSessionState(sessionId, {
      progress: 0,
      results: [],
      error: null
    });

    // Rozpocznij przetwarzanie w tle
    processFiles(sessionId, files, models).catch(error => {
      logger.error('Błąd podczas przetwarzania wsadowego', { sessionId, error });
      updateSessionState(sessionId, { 
        error: 'Błąd podczas przetwarzania',
        status: 'error'
      });
    });

    return NextResponse.json({ sessionId });

  } catch (error) {
    logger.error('Błąd podczas inicjalizacji przetwarzania', { error });
    return NextResponse.json(
      { error: 'Błąd podczas inicjalizacji przetwarzania' },
      { status: 500 }
    );
  }
}

async function processFiles(sessionId: string, files: File[], models: string[]) {
  const totalFiles = files.length;
  let processedFiles = 0;

  // Inicjalizuj stan sesji
  updateSessionState(sessionId, {
    status: 'processing',
    progress: 0,
    error: null
  });

  for (const file of files) {
    logger.info('Rozpoczynam przetwarzanie pliku', {
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      progress: {
        current: processedFiles + 1,
        total: totalFiles
      }
    });

    try {
      // Aktualizuj postęp - rozpoczęcie przetwarzania pliku
      const fileStartProgress = (processedFiles / totalFiles) * 100;
      updateSessionState(sessionId, {
        status: 'processing',
        progress: fileStartProgress
      });

      const fileResults = await processFile(file, models, sessionId);
      
      // Zapisz wyniki do cache z sessionId
      for (const result of fileResults) {
        cacheManager.set(file.name, models[0], result, sessionId);
      }
      
      processedFiles++;
      
      // Aktualizuj postęp - zakończenie przetwarzania pliku
      const progress = (processedFiles / totalFiles) * 100;
      updateSessionState(sessionId, {
        progress,
        status: progress === 100 ? 'success' : 'processing'
      });

      logger.info('Zakończono przetwarzanie pliku', {
        sessionId,
        fileName: file.name,
        status: 'success'
      });

    } catch (error) {
      logger.error('Błąd podczas przetwarzania pliku', {
        sessionId,
        fileName: file.name,
        error
      });

      updateSessionState(sessionId, {
        error: error instanceof Error ? error.message : 'Nieznany błąd',
        status: 'error'
      });

      throw error;
    }
  }
} 