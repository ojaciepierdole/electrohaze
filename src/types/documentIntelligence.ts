export interface DocumentIntelligenceModel {
  modelId: string;
  description: string;
  createdDateTime?: string;
}

export interface DocumentIntelligenceResponse {
  models: DocumentIntelligenceModel[];
  nextLink?: string;
} 