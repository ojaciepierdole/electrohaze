import type { DocumentField, TransformationContext, TransformationResult } from '@/types/document';

export interface Rule {
  name: string;
  description: string;
  extract: (text: string) => string | null;
  validate: (value: string) => boolean;
  normalize: (value: string) => string;
  confidence: number;
  condition?: (context: TransformationContext) => boolean;
  transform?: (value: string, context: TransformationContext) => TransformationResult;
} 