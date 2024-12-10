import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';

if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
  throw new Error('Brak wymaganych zmiennych środowiskowych dla Azure Document Intelligence');
}

export const client = new DocumentAnalysisClient(
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY)
); 