import type { FieldWithConfidence } from './processing';

export interface DocumentSections {
  title: string;
  fields: Record<string, string | number>;
  confidence?: number;
  metadata?: Record<string, unknown>;
  ppe?: Record<string, FieldWithConfidence>;
  customer?: Record<string, FieldWithConfidence>;
  correspondence?: Record<string, FieldWithConfidence>;
  supplier?: Record<string, FieldWithConfidence>;
  billing?: Record<string, FieldWithConfidence>;
} 