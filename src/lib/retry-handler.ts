import { AzureDocumentIntelligenceError } from './azure-errors';

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

interface RetryContext {
  attempt: number;
  error: unknown;
  startTime: number;
}

type RetryableFunction<T> = () => Promise<T>;

export class RetryHandler {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxAttempts: 3,
      initialDelay: 1000, // 1 sekunda
      maxDelay: 10000,    // 10 sekund
      backoffFactor: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      ...options
    };
  }

  private calculateDelay(attempt: number): number {
    const delay = this.options.initialDelay * Math.pow(this.options.backoffFactor, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= this.options.maxAttempts) return false;

    if (error instanceof AzureDocumentIntelligenceError) {
      return this.options.retryableStatusCodes.includes(error.statusCode || 0);
    }

    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute<T>(
    operation: RetryableFunction<T>,
    onRetry?: (context: RetryContext) => void
  ): Promise<T> {
    let attempt = 1;
    const startTime = Date.now();

    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        const retryContext: RetryContext = {
          attempt,
          error,
          startTime
        };

        onRetry?.(retryContext);

        const delayMs = this.calculateDelay(attempt);
        await this.delay(delayMs);

        attempt++;
      }
    }
  }

  // Metoda pomocnicza do tworzenia funkcji z retryingiem
  static withRetry<T>(
    operation: RetryableFunction<T>,
    options?: Partial<RetryOptions>
  ): RetryableFunction<T> {
    const handler = new RetryHandler(options);
    return () => handler.execute(operation);
  }
} 