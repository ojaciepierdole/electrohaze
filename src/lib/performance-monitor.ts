import { Logger } from './logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  name: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastDuration: number;
}

export interface ActiveOperation {
  operationId: string;
  name: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeOperations: Map<string, PerformanceMetric> = new Map();
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(name: string, metadata?: Record<string, unknown>): string {
    const operationId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata
    };

    this.activeOperations.set(operationId, metric);
    this.logger.debug(`Rozpoczęto operację: ${name}`, { operationId, ...metadata });

    return operationId;
  }

  endOperation(operationId: string, additionalMetadata?: Record<string, unknown>): void {
    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      this.logger.warn(`Próba zakończenia nieistniejącej operacji: ${operationId}`);
      return;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    const metrics = this.metrics.get(metric.name) || [];
    metrics.push(metric);
    this.metrics.set(metric.name, metrics);

    this.activeOperations.delete(operationId);

    this.logger.debug(`Zakończono operację: ${metric.name}`, {
      operationId,
      duration: metric.duration,
      ...metric.metadata
    });

    // Loguj ostrzeżenie dla długich operacji (np. powyżej 5 sekund)
    if (metric.duration > 5000) {
      this.logger.warn(`Długi czas wykonania operacji: ${metric.name}`, {
        operationId,
        duration: metric.duration,
        ...metric.metadata
      });
    }
  }

  getMetrics(name?: string): PerformanceStats[] {
    const calculateStats = (metrics: PerformanceMetric[]): PerformanceStats => {
      const durations = metrics
        .filter(m => m.duration !== undefined)
        .map(m => m.duration!);

      if (durations.length === 0) {
        return {
          name: metrics[0].name,
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          lastDuration: 0
        };
      }

      return {
        name: metrics[0].name,
        count: durations.length,
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        lastDuration: durations[durations.length - 1]
      };
    };

    if (name) {
      const metrics = this.metrics.get(name);
      return metrics ? [calculateStats(metrics)] : [];
    }

    return Array.from(this.metrics.entries())
      .map(([_, metrics]) => calculateStats(metrics));
  }

  getActiveOperations(): ActiveOperation[] {
    const now = Date.now();
    return Array.from(this.activeOperations.entries()).map(([id, metric]) => ({
      operationId: id,
      name: metric.name,
      duration: now - metric.startTime,
      metadata: metric.metadata
    }));
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // Metoda pomocnicza do mierzenia czasu wykonania funkcji
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const operationId = this.startOperation(name, metadata);
    try {
      const result = await operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Wersja synchroniczna
  measure<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const operationId = this.startOperation(name, metadata);
    try {
      const result = operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
} 