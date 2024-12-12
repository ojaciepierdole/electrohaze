import { DocumentAnalysisClient, AzureKeyCredential, DocumentAnalysisResponse } from '@azure/ai-form-recognizer';
import { DocumentValidator } from './document-validator';
import { AzureDocumentIntelligenceError } from './azure-errors';
import { DocumentCache } from './cache-service';
import { RetryHandler } from './retry-handler';
import { Logger } from './logger';
import { PerformanceMonitor } from './performance-monitor';

interface BatchTask {
  file: File;
  modelId: string;
  index: number;
}

interface BatchProgress {
  current: number;
  total: number;
  file: string;
  modelId: string;
  fromCache?: boolean;
}

export class AzureDocumentService {
  private client: DocumentAnalysisClient;
  private cache: DocumentCache;
  private retryHandler: RetryHandler;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private static instance: AzureDocumentService;
  private static readonly MAX_CONCURRENT_REQUESTS = 15;

  private constructor() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new AzureDocumentIntelligenceError(
        'Brak wymaganych zmiennych środowiskowych dla Azure Document Intelligence',
        'INVALID_REQUEST',
        400
      );
    }

    this.client = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key)
    );

    this.cache = DocumentCache.getInstance();
    this.retryHandler = new RetryHandler();
    this.logger = Logger.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();

    this.logger.info('Zainicjalizowano AzureDocumentService', {
      endpoint,
      maxConcurrentRequests: AzureDocumentService.MAX_CONCURRENT_REQUESTS
    });
  }

  static getInstance(): AzureDocumentService {
    if (!AzureDocumentService.instance) {
      AzureDocumentService.instance = new AzureDocumentService();
    }
    return AzureDocumentService.instance;
  }

  private async analyzeDocumentWithRetry(
    file: File,
    modelId: string,
    skipCache = false
  ): Promise<DocumentAnalysisResponse> {
    const context = {
      fileName: file.name,
      fileSize: file.size,
      modelId,
      skipCache
    };

    return this.performanceMonitor.measureAsync('analyzeDocument', async () => {
      // Sprawdź cache
      if (!skipCache) {
        const cachedResult = await this.cache.get(file, modelId);
        if (cachedResult) {
          this.logger.info('Znaleziono wynik w cache', {
            ...context,
            fromCache: true
          });
          return cachedResult;
        }
      }

      try {
        // Walidacja modelu
        DocumentValidator.validateModelId(modelId);

        // Walidacja i przygotowanie dokumentu
        const buffer = await DocumentValidator.validateAndPrepareDocument(file);

        // Rozpoczęcie analizy z retryingiem
        this.logger.info('Rozpoczynam analizę dokumentu', context);

        const result = await this.retryHandler.execute(
          async () => {
            const poller = await this.client.beginAnalyzeDocument(modelId, buffer);
            const result = await poller.pollUntilDone();

            if (!result.documents?.[0]) {
              throw new AzureDocumentIntelligenceError(
                'Nie znaleziono dokumentu w odpowiedzi',
                'INVALID_RESPONSE',
                500
              );
            }

            return result;
          },
          (retryContext) => {
            this.logger.warn('Ponawiam próbę analizy dokumentu', {
              ...context,
              attempt: retryContext.attempt,
              error: retryContext.error
            });
          }
        );

        this.logger.info('Zakończono analizę dokumentu', {
          ...context,
          confidence: result.documents[0].confidence,
          pageCount: result.pages?.length
        });

        // Zapisz wynik w cache
        if (!skipCache) {
          await this.cache.set(file, modelId, result);
        }

        return result;
      } catch (error) {
        this.logger.error('Błąd podczas analizy dokumentu', {
          ...context,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw AzureDocumentIntelligenceError.fromResponse(error);
      }
    }, context);
  }

  async analyzeDocument(
    file: File,
    modelId: string,
    options: { skipCache?: boolean } = {}
  ): Promise<DocumentAnalysisResponse> {
    return this.analyzeDocumentWithRetry(file, modelId, options.skipCache);
  }

  async analyzeBatch(
    files: File[],
    modelIds: string[],
    onProgress?: (progress: BatchProgress) => void,
    options: { skipCache?: boolean } = {}
  ): Promise<DocumentAnalysisResponse[]> {
    const context = {
      filesCount: files.length,
      modelIds,
      skipCache: options.skipCache
    };

    return this.performanceMonitor.measureAsync('analyzeBatch', async () => {
      if (!files.length || !modelIds.length) {
        throw new AzureDocumentIntelligenceError(
          'Brak plików lub modeli do analizy',
          'INVALID_REQUEST',
          400
        );
      }

      const results: DocumentAnalysisResponse[] = [];
      let processed = 0;
      const total = files.length * modelIds.length;

      this.logger.info('Rozpoczynam analizę wsadową', {
        ...context,
        totalOperations: total
      });

      // Przygotuj wszystkie zadania
      const tasks: BatchTask[] = files.flatMap((file) => 
        modelIds.map(modelId => ({
          file,
          modelId,
          index: processed++
        }))
      );

      // Przetwarzaj zadania w grupach
      for (let i = 0; i < tasks.length; i += AzureDocumentService.MAX_CONCURRENT_REQUESTS) {
        const batch = tasks.slice(i, i + AzureDocumentService.MAX_CONCURRENT_REQUESTS);
        
        const batchResults = await Promise.all(
          batch.map(async task => {
            const result = await this.analyzeDocumentWithRetry(
              task.file,
              task.modelId,
              options.skipCache
            );
            
            onProgress?.({
              current: task.index + 1,
              total,
              file: task.file.name,
              modelId: task.modelId,
              fromCache: !options.skipCache
            });

            return result;
          })
        );

        results.push(...batchResults);

        this.logger.info('Zakończono przetwarzanie partii dokumentów', {
          ...context,
          batchSize: batch.length,
          processedTotal: results.length,
          remainingTotal: total - results.length
        });
      }

      return results;
    }, context);
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.logger.info('Czyszczenie cache');
    this.cache.clear();
  }

  getPerformanceStats() {
    return this.performanceMonitor.getMetrics();
  }

  getActiveOperations() {
    return this.performanceMonitor.getActiveOperations();
  }
} 