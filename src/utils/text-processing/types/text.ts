import type { TransformationMetadata } from '@/types/processing';

export interface TextField {
  content: string;
  confidence: number;
  metadata?: Partial<TransformationMetadata>;
}

export interface TextProcessingOptions {
  trim?: boolean;
  toUpper?: boolean;
  toLower?: boolean;
  removeSpecialChars?: boolean;
  removeAccents?: boolean;
  removePunctuation?: boolean;
  removeNumbers?: boolean;
  normalizePolish?: boolean;
} 