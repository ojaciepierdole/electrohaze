import { DocumentAnalysisResponse } from '@/types/azure';

interface CacheEntry {
  value: DocumentAnalysisResponse;
  timestamp: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private static instance: CacheService;

  private constructor() {
    this.cache = new Map();
    this.stats = {
      size: 0,
      hits: 0,
      misses: 0
    };
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private generateKey(file: File, modelId: string): string {
    return `${file.name}-${file.size}-${modelId}`;
  }

  public async get(file: File, modelId: string): Promise<DocumentAnalysisResponse | undefined> {
    const key = this.generateKey(file, modelId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  public async set(file: File, modelId: string, value: DocumentAnalysisResponse, ttl: number = 3600000): Promise<void> {
    const key = this.generateKey(file, modelId);
    const entry: CacheEntry = {
      value,
      timestamp: Date.now() + ttl
    };
    
    if (!this.cache.has(key)) {
      this.stats.size++;
    }
    
    this.cache.set(key, entry);
  }

  public delete(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.size--;
    }
  }

  public clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  public cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.timestamp) {
        this.delete(key);
      }
    });
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }
} 