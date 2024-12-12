export type AzureErrorCode = 
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_NOT_FOUND'
  | 'DOCUMENT_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INVALID_MODEL_ID'
  | 'SERVICE_ERROR'
  | 'INVALID_RESPONSE';

export class AzureDocumentIntelligenceError extends Error {
  constructor(
    message: string,
    public readonly code: AzureErrorCode,
    public readonly statusCode?: number,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'AzureDocumentIntelligenceError';
  }

  static fromResponse(error: unknown): AzureDocumentIntelligenceError {
    if (error instanceof AzureDocumentIntelligenceError) {
      return error;
    }

    // Standardowe kody błędów Azure
    const azureErrorCodes = {
      InvalidRequest: 'INVALID_REQUEST',
      Unauthorized: 'UNAUTHORIZED',
      QuotaExceeded: 'QUOTA_EXCEEDED',
      ModelNotFound: 'MODEL_NOT_FOUND',
      DocumentTooLarge: 'DOCUMENT_TOO_LARGE',
      UnsupportedFileType: 'UNSUPPORTED_FILE_TYPE',
      InvalidModelId: 'INVALID_MODEL_ID',
      ServiceError: 'SERVICE_ERROR',
      InvalidResponse: 'INVALID_RESPONSE'
    } as const;

    type AzureErrorResponse = {
      response?: {
        status: number;
        headers?: {
          get(name: string): string | null;
        };
        data?: {
          error?: {
            message?: string;
            code?: string;
          };
          message?: string;
        };
      };
    };

    // Mapowanie HTTP status codes na kody błędów
    const statusToErrorCode: Record<number, keyof typeof azureErrorCodes> = {
      400: 'InvalidRequest',
      401: 'Unauthorized',
      404: 'ModelNotFound',
      413: 'DocumentTooLarge',
      415: 'UnsupportedFileType',
      429: 'QuotaExceeded',
      500: 'ServiceError'
    };

    let message = 'Wystąpił błąd podczas przetwarzania dokumentu';
    let code: AzureErrorCode = 'SERVICE_ERROR';
    let statusCode: number | undefined;
    let requestId: string | undefined;

    const azureError = error as AzureErrorResponse;

    if (azureError.response) {
      statusCode = azureError.response.status;
      requestId = azureError.response.headers?.get('x-request-id') ?? undefined;
      
      if (statusCode && statusCode in statusToErrorCode) {
        const errorCode = statusToErrorCode[statusCode];
        code = azureErrorCodes[errorCode] as AzureErrorCode;
      }

      try {
        const errorBody = azureError.response.data;
        if (typeof errorBody === 'object' && errorBody !== null) {
          message = errorBody.error?.message || errorBody.message || message;
          if (errorBody.error?.code) {
            const providedCode = errorBody.error.code.toUpperCase();
            if (Object.values(azureErrorCodes).includes(providedCode as AzureErrorCode)) {
              code = providedCode as AzureErrorCode;
            }
          }
        }
      } catch {
        // Ignorujemy błędy parsowania body
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    return new AzureDocumentIntelligenceError(message, code, statusCode, requestId);
  }

  get userMessage(): string {
    switch (this.code) {
      case 'INVALID_REQUEST':
        return 'Nieprawidłowe żądanie. Sprawdź poprawność przesyłanych danych.';
      case 'UNAUTHORIZED':
        return 'Brak autoryzacji. Sprawdź poprawność klucza API.';
      case 'QUOTA_EXCEEDED':
        return 'Przekroczono limit żądań. Spróbuj ponownie później.';
      case 'MODEL_NOT_FOUND':
        return 'Nie znaleziono wybranego modelu. Sprawdź identyfikator modelu.';
      case 'DOCUMENT_TOO_LARGE':
        return 'Dokument jest zbyt duży. Maksymalny rozmiar to 50MB.';
      case 'UNSUPPORTED_FILE_TYPE':
        return 'Nieobsługiwany typ pliku. Obsługiwane formaty to: PDF, PNG, JPEG, TIFF.';
      case 'INVALID_MODEL_ID':
        return 'Nieprawidłowy identyfikator modelu.';
      case 'INVALID_RESPONSE':
        return 'Otrzymano nieprawidłową odpowiedź z serwera Azure.';
      case 'SERVICE_ERROR':
        return 'Wystąpił błąd serwisu Azure. Spróbuj ponownie później.';
      default:
        return this.message;
    }
  }
} 