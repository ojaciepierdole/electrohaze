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

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'prebuilt' | 'custom';
  capabilities: string[];
  fields: string[];
  status: 'active' | 'inactive' | 'training';
}

export interface ModelGroup {
  name: string;
  models: ModelDefinition[];
}

export interface ModelConfig {
  groups: ModelGroup[];
  defaultModel: string;
} 