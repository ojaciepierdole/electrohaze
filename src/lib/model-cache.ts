import { Model } from '@/types/models';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

interface ModelCache {
  models: Model[];
  timestamp: number;
}

interface AzureModel {
  modelId: string;
  description?: string;
  createdDateTime: string;
  expirationDateTime?: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

class ModelCacheManager {
  private static instance: ModelCacheManager;
  private cache: ModelCache | null = null;

  private constructor() {}

  static getInstance(): ModelCacheManager {
    if (!ModelCacheManager.instance) {
      ModelCacheManager.instance = new ModelCacheManager();
    }
    return ModelCacheManager.instance;
  }

  async getModels(): Promise<Model[]> {
    // Sprawdź czy cache jest ważny
    if (this.isCacheValid()) {
      logger.debug('Zwracam modele z cache');
      return this.cache!.models;
    }

    // Pobierz świeże dane
    try {
      const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, '');
      const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

      if (!endpoint || !key) {
        throw new Error('Brak konfiguracji Azure Document Intelligence');
      }

      const response = await fetch(
        `${endpoint}/documentintelligence/documentModels?api-version=2023-10-31-preview`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': key
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Błąd pobierania modeli: ${response.statusText}`);
      }

      const { value: modelsList } = await response.json();
      
      const mappedModels: Model[] = (modelsList as AzureModel[]).map(model => ({
        id: model.modelId,
        name: model.description || model.modelId,
        description: model.description || '',
        fields: [], // TODO: Dodać pobieranie pól
        version: '1.0',
        isCustom: !model.modelId.startsWith('prebuilt-'),
        status: 'ready' as const
      }));

      // Aktualizuj cache
      this.cache = {
        models: mappedModels,
        timestamp: Date.now()
      };

      logger.info('Zaktualizowano cache modeli', { count: mappedModels.length });
      return mappedModels;
    } catch (error) {
      logger.error('Błąd podczas pobierania modeli', { error });
      // Jeśli mamy stare dane w cache, użyj ich jako fallback
      if (this.cache) {
        logger.warn('Używam starych danych z cache jako fallback');
        return this.cache.models;
      }
      throw error;
    }
  }

  private isCacheValid(): boolean {
    return (
      this.cache !== null &&
      Date.now() - this.cache.timestamp < CACHE_DURATION
    );
  }

  clearCache(): void {
    this.cache = null;
    logger.info('Wyczyszczono cache modeli');
  }
}

export const modelCache = ModelCacheManager.getInstance(); 