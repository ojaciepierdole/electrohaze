import { z } from 'zod';
import type { DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';

// Schemat walidacji dla dat w formacie ISO
export const ISODateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  'Data musi być w formacie ISO 8601'
);

// Typ dla dat w formacie ISO
export type ISODateString = z.infer<typeof ISODateSchema>;

// Pomocnicze funkcje do konwersji dat
export const DateHelpers = {
  toISOString(date: Date | string | undefined): ISODateString | undefined {
    if (!date) return undefined;
    if (date instanceof Date) return date.toISOString() as ISODateString;
    if (typeof date === 'string') {
      try {
        return new Date(date).toISOString() as ISODateString;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },

  fromISOString(isoString: ISODateString | undefined): Date | undefined {
    if (!isoString) return undefined;
    try {
      return new Date(isoString);
    } catch {
      return undefined;
    }
  },

  formatForDisplay(date: ISODateString | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '';
    }
  }
};

// Podstawowe typy dla danych biznesowych
export interface BaseDataGroup {
  confidence?: number;
}

export interface AddressData extends BaseDataGroup {
  street?: string;
  building?: string;
  unit?: string;
  postalCode?: string;
  city?: string;
}

export interface PersonData extends BaseDataGroup {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  taxId?: string;
  title?: string;
}

export interface BillingPeriod extends BaseDataGroup {
  startDate?: ISODateString;
  endDate?: ISODateString;
}

// Podstawowe typy dla pól
export interface FieldWithConfidence {
  content: string | null | undefined;
  confidence: number;
  isEnriched?: boolean;
  metadata?: Record<string, unknown>;
}

// Typy sekcji dokumentu
export type DataSection = 'ppe' | 'correspondence' | 'supplier' | 'delivery';

// Opcje przetwarzania
export interface ProcessingOptions {
  confidenceThreshold?: number;
  preserveCase?: boolean;
  strictMode?: boolean;
}

// Typy dla pewności i kompletności
export interface GroupConfidence {
  averageConfidence: number;
  filledFields: number;
  totalFields: number;
  fieldConfidences: Record<string, number>;
}

export interface DocumentConfidence {
  groups: Record<string, GroupConfidence>;
  averageConfidence: number;
  totalFilledFields: number;
  totalFields: number;
}

// Konfiguracja modelu
export interface SavedModelConfig {
  modelId: string;
  timestamp: number;
}

// Typy dla layoutu
export interface ColumnField {
  key: string;
  label: string;
}

export interface ColumnLayout {
  columns: Array<Array<ColumnField>>;
  gridClass: string;
} 