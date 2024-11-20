import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";

if (!process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || !process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY) {
  throw new Error("Missing Azure Document Intelligence credentials");
}

export const client = new DocumentAnalysisClient(
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY)
); 