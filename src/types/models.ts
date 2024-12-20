import type { DocumentField } from './processing';

export interface Model {
  id: string;
  name: string;
  description: string;
  fields: string[];
  version: string;
  isCustom: boolean;
  status: 'ready' | 'training' | 'error';
}

export interface ModelDetails extends Model {
  createdDateTime: string;
  expirationDateTime: string;
  apiVersion: string;
  docTypes: Record<string, {
    fieldSchema: Record<string, unknown>;
    buildMode: string;
  }>;
}

export interface ModelCache {
  models: Model[];
  timestamp: number;
} 