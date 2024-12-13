import { NextResponse } from 'next/server';
import { AzureDocumentService } from '@/lib/azure-document-service';
import { Logger } from '@/lib/logger';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { AlertService } from '@/lib/alert-service';
import { mapDocumentAnalysisResult } from '@/utils/document-mapping';
import { safeValidateProcessingResult } from '@/types/validation';
import { AzureDocumentIntelligenceError } from '@/lib/azure-errors';

const logger = Logger.getInstance();
const performanceMonitor = PerformanceMonitor.getInstance();
const alertService = AlertService.getInstance();

export async function POST(request: Request) {
  const operationId = performanceMonitor.startOperation('analyze-document');

  try {
    // Sprawdzenie Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      logger.warn('Nieprawidłowy Content-Type', { contentType });
      return NextResponse.json(
        { error: 'Nieprawidłowy format danych. Wymagany jest multipart/form-data.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const modelId = formData.get('modelId');
    const skipCache = formData.get('skipCache') === 'true';

    const context = {
      operationId,
      fileName: file instanceof File ? file.name : undefined,
      fileSize: file instanceof File ? file.size : undefined,
      modelId,
      skipCache
    };

    // Walidacja obecności wymaganych pól
    if (!file || !modelId) {
      logger.warn('Brak wymaganych pól', context);
      return NextResponse.json(
        { error: 'Brak wymaganych pól: file i modelId' },
        { status: 400 }
      );
    }

    // Sprawdzenie typu file
    if (!(file instanceof File)) {
      logger.warn('Nieprawidłowy typ pliku', context);
      return NextResponse.json(
        { error: 'Pole file musi być plikiem' },
        { status: 400 }
      );
    }

    // Sprawdzenie typu modelId
    if (typeof modelId !== 'string') {
      logger.warn('Nieprawidłowy typ modelId', context);
      return NextResponse.json(
        { error: 'Pole modelId musi być tekstem' },
        { status: 400 }
      );
    }

    logger.info('Rozpoczynam przetwarzanie dokumentu', context);

    const service = AzureDocumentService.getInstance();
    const result = await service.analyzeDocument(file, modelId, { skipCache });

    // Sprawdzenie czy mamy dokumenty w wyniku
    if (!result.documents || result.documents.length === 0) {
      logger.error('Brak dokumentów w wyniku analizy', context);
      return NextResponse.json(
        { error: 'Nie znaleziono dokumentu w wyniku analizy' },
        { status: 422 }
      );
    }

    const document = result.documents[0];

    // Mapowanie wyniku do formatu aplikacji
    const mappedResult = mapDocumentAnalysisResult(document.fields);

    const processingTime = performanceMonitor.getActiveOperations()
      .find(op => op.operationId === operationId)?.duration || 0;

    const modelResult = {
      modelId,
      fields: document.fields,
      confidence: document.confidence,
      pageCount: result.pages?.length || 1
    };

    const processingResult = {
      fileName: file.name,
      modelResults: [modelResult],
      processingTime,
      mappedData: mappedResult,
      cacheStats: service.getCacheStats(),
      performanceStats: service.getPerformanceStats(),
      alerts: alertService.getActiveAlerts({ acknowledged: false })
    };

    // Walidacja wyniku przetwarzania
    const validationResult = safeValidateProcessingResult(processingResult);
    if (!validationResult.success) {
      logger.error('Nieprawidłowy format wyniku przetwarzania', {
        ...context,
        error: validationResult.error
      });

      return NextResponse.json(
        { 
          error: 'Błąd walidacji danych',
          details: validationResult.error
        },
        { status: 422 }
      );
    }

    // Sprawdzenie warunków alertów
    await alertService.checkAndTrigger({
      ...context,
      processingTime,
      confidence: document.confidence,
      validationError: validationResult.error
    });

    logger.info('Zakończono przetwarzanie dokumentu', {
      ...context,
      confidence: document.confidence,
      pageCount: result.pages?.length || 1,
      processingTime
    });

    performanceMonitor.endOperation(operationId);
    return NextResponse.json(validationResult.data);

  } catch (error) {
    const errorContext = {
      operationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: error instanceof AzureDocumentIntelligenceError ? error.statusCode : 500
    };

    logger.error('Błąd podczas przetwarzania dokumentu', errorContext);

    // Sprawdzenie warunków alertów dla błędu
    await alertService.checkAndTrigger(errorContext);

    performanceMonitor.endOperation(operationId, {
      error: errorContext.error,
      statusCode: errorContext.statusCode
    });

    if (error instanceof AzureDocumentIntelligenceError) {
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.statusCode || 500 }
      );
    }

    // Dla nieznanych błędów zwracamy ogólny komunikat
    return NextResponse.json(
      { error: 'Wystąpił nieoczekiwany błąd podczas przetwarzania dokumentu' },
      { status: 500 }
    );
  }
}

// Endpoint do czyszczenia cache'a
export async function DELETE() {
  const operationId = performanceMonitor.startOperation('clear-cache');

  try {
    logger.info('Czyszczenie cache', { operationId });

    const service = AzureDocumentService.getInstance();
    service.clearCache();

    performanceMonitor.endOperation(operationId);
    return NextResponse.json({ 
      message: 'Cache wyczyszczony',
      performanceStats: service.getPerformanceStats()
    });
  } catch (error) {
    const errorContext = {
      operationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    logger.error('Błąd podczas czyszczenia cache', errorContext);
    await alertService.checkAndTrigger(errorContext);

    performanceMonitor.endOperation(operationId, errorContext);

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas czyszczenia cache' },
      { status: 500 }
    );
  }
}

// Endpoint do pobierania statystyk
export async function GET() {
  try {
    const service = AzureDocumentService.getInstance();
    return NextResponse.json({
      cacheStats: service.getCacheStats(),
      performanceStats: service.getPerformanceStats(),
      activeOperations: service.getActiveOperations(),
      alerts: alertService.getActiveAlerts({ acknowledged: false })
    });
  } catch (error) {
    logger.error('Błąd podczas pobierania statystyk', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statystyk' },
      { status: 500 }
    );
  }
} 