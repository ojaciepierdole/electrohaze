import type { ProcessingResult } from '@/types/processing';

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, Map<string, ProcessingResult>>;
  private sessionCache: Map<string, string[]>;

  private constructor() {
    this.cache = new Map();
    this.sessionCache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(fileName: string, modelId: string, result: ProcessingResult, sessionId?: string) {
    if (!this.cache.has(fileName)) {
      this.cache.set(fileName, new Map());
    }
    this.cache.get(fileName)!.set(modelId, result);

    if (sessionId) {
      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, []);
      }
      this.sessionCache.get(sessionId)!.push(fileName);
    }
  }

  get(fileName: string, modelId: string): ProcessingResult | undefined {
    return this.cache.get(fileName)?.get(modelId);
  }

  getBySessionId(sessionId: string): ProcessingResult[] {
    const fileNames = this.sessionCache.get(sessionId) || [];
    const results: ProcessingResult[] = [];

    for (const fileName of fileNames) {
      const modelResults = this.cache.get(fileName);
      if (modelResults) {
        results.push(...Array.from(modelResults.values()));
      }
    }

    return results;
  }

  clear() {
    this.cache.clear();
    this.sessionCache.clear();
  }
}

export const cacheManager = CacheManager.getInstance(); 