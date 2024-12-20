import type { ProcessingResult } from '@/types/processing';

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, Map<string, ProcessingResult>>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public set(fileName: string, modelId: string, result: ProcessingResult, sessionId: string): void {
    let sessionCache = this.cache.get(sessionId);
    if (!sessionCache) {
      sessionCache = new Map();
      this.cache.set(sessionId, sessionCache);
    }
    sessionCache.set(`${fileName}-${modelId}`, result);
  }

  public get(fileName: string, modelId: string, sessionId: string): ProcessingResult | undefined {
    const sessionCache = this.cache.get(sessionId);
    if (!sessionCache) return undefined;
    return sessionCache.get(`${fileName}-${modelId}`);
  }

  public getBySessionId(sessionId: string): ProcessingResult[] {
    const sessionCache = this.cache.get(sessionId);
    if (!sessionCache) return [];
    return Array.from(sessionCache.values());
  }

  public delete(fileName: string, modelId: string, sessionId: string): void {
    const sessionCache = this.cache.get(sessionId);
    if (sessionCache) {
      sessionCache.delete(`${fileName}-${modelId}`);
      if (sessionCache.size === 0) {
        this.cache.delete(sessionId);
      }
    }
  }

  public deleteSession(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  public clear(): void {
    this.cache.clear();
  }

  public cleanup(maxAge: number = 3600000): void {
    const now = Date.now();
    for (const [sessionId, sessionCache] of this.cache.entries()) {
      let hasExpired = false;
      for (const [key, result] of sessionCache.entries()) {
        if (result.timing?.start && now - result.timing.start > maxAge) {
          sessionCache.delete(key);
          hasExpired = true;
        }
      }
      if (hasExpired && sessionCache.size === 0) {
        this.cache.delete(sessionId);
      }
    }
  }
}

export const cacheManager = CacheManager.getInstance(); 