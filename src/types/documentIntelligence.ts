export interface DocumentIntelligenceModel {
  id: string;
  name: string;
  description?: string;
  fields?: Array<{
    name: string;
    type: string;
    isRequired: boolean;
    description: string;
    group?: string;
  }>;
}

export interface DocumentIntelligenceResponse {
  models: DocumentIntelligenceModel[];
} 