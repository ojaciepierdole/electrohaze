import type { DocumentField } from './processing';

export interface ModelResult {
  modelId: string;
  fields: Record<string, DocumentField>;
  confidence: number;
  pageCount: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
  version?: string;
  type?: string;
  metadata?: Record<string, unknown>;
} 