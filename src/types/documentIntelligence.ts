export interface DocumentIntelligenceModel {
  modelId: string;
  description: string;
  createdOn: Date;
}

export interface DocumentIntelligenceResponse {
  models: DocumentIntelligenceModel[];
} 