import { AzureDocumentIntelligenceError } from './azure-errors';

export class DocumentValidator {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff'
  ] as const;

  private static readonly VALID_PREBUILT_MODELS = [
    'prebuilt-document',
    'prebuilt-layout',
    'prebuilt-invoice',
    'prebuilt-receipt',
    'prebuilt-tax.w2',
    'prebuilt-businessCard'
  ] as const;

  static async validateAndPrepareDocument(file: File): Promise<ArrayBuffer> {
    // Sprawdzenie rozmiaru
    if (file.size > this.MAX_FILE_SIZE) {
      throw new AzureDocumentIntelligenceError(
        'Plik jest zbyt duży',
        'DOCUMENT_TOO_LARGE',
        413
      );
    }

    // Sprawdzenie typu MIME
    if (!this.SUPPORTED_MIME_TYPES.includes(file.type as typeof this.SUPPORTED_MIME_TYPES[number])) {
      throw new AzureDocumentIntelligenceError(
        'Nieobsługiwany typ pliku',
        'UNSUPPORTED_FILE_TYPE',
        415
      );
    }

    try {
      // Konwersja do ArrayBuffer
      const buffer = await file.arrayBuffer();

      // Podstawowa walidacja zawartości pliku
      if (buffer.byteLength === 0) {
        throw new AzureDocumentIntelligenceError(
          'Plik jest pusty',
          'INVALID_REQUEST',
          400
        );
      }

      // Sprawdzenie sygnatury pliku PDF
      if (file.type === 'application/pdf') {
        const signature = new Uint8Array(buffer.slice(0, 5));
        const isPDF = signature[0] === 0x25 && // %
                     signature[1] === 0x50 && // P
                     signature[2] === 0x44 && // D
                     signature[3] === 0x46 && // F
                     signature[4] === 0x2D;   // -
        
        if (!isPDF) {
          throw new AzureDocumentIntelligenceError(
            'Nieprawidłowy format pliku PDF',
            'INVALID_REQUEST',
            400
          );
        }
      }

      return buffer;
    } catch (error) {
      if (error instanceof AzureDocumentIntelligenceError) {
        throw error;
      }
      throw new AzureDocumentIntelligenceError(
        'Błąd podczas przygotowywania pliku',
        'INVALID_REQUEST',
        400
      );
    }
  }

  static validateModelId(modelId: string): void {
    if (!modelId) {
      throw new AzureDocumentIntelligenceError(
        'Brak identyfikatora modelu',
        'INVALID_MODEL_ID',
        400
      );
    }

    // Sprawdzenie formatu prebuilt modeli
    if (modelId.startsWith('prebuilt-')) {
      if (!this.VALID_PREBUILT_MODELS.includes(modelId as typeof this.VALID_PREBUILT_MODELS[number])) {
        throw new AzureDocumentIntelligenceError(
          'Nieprawidłowy identyfikator modelu predefiniowanego',
          'INVALID_MODEL_ID',
          400
        );
      }
      return;
    }

    // Sprawdzenie formatu custom modeli
    const customModelRegex = /^[a-zA-Z0-9-]{1,64}$/;
    if (!customModelRegex.test(modelId)) {
      throw new AzureDocumentIntelligenceError(
        'Nieprawidłowy format identyfikatora modelu',
        'INVALID_MODEL_ID',
        400
      );
    }
  }
} 