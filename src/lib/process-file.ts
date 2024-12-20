import { DocumentAnalysisClient, AzureKeyCredential, AnalyzeResult, AnalyzedDocument } from '@azure/ai-form-recognizer';
import { Logger } from '@/lib/logger';
import { updateSessionState } from '@/app/api/analyze/progress/route';
import type { ProcessingResult } from '@/types/processing';

const logger = Logger.getInstance();

// Inicjalizacja klienta Azure Document Intelligence
function getDocumentAnalysisClient() {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error('Brak konfiguracji Azure Document Intelligence');
  }

  return new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
}

export async function processFile(file: File, models: string[], sessionId: string): Promise<ProcessingResult[]> {
  const client = getDocumentAnalysisClient();
  const results: ProcessingResult[] = [];
  const startTime = Date.now();

  try {
    // Konwertuj File na ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uploadTime = Date.now() - startTime;
    
    // Przetwarzaj plik dla każdego wybranego modelu
    for (const [index, modelId] of models.entries()) {
      const modelStartTime = Date.now();
      
      try {
        // Rozpocznij analizę
        const poller = await client.beginAnalyzeDocument(modelId, arrayBuffer);
        
        // Monitoruj postęp
        while (!poller.isDone()) {
          const state = await poller.getOperationState();
          const operationProgress = state.status === 'running' ? 50 : state.status === 'succeeded' ? 100 : 0;
          
          // Poczekaj chwilę przed kolejnym sprawdzeniem
          await new Promise(resolve => setTimeout(resolve, 1000));
          await poller.poll();
        }
        
        // Pobierz wyniki
        const analysisResult = await poller.pollUntilDone();
        const modelEndTime = Date.now();

        // Konwertuj wyniki do naszego formatu
        const result: ProcessingResult = {
          fileName: file.name,
          timing: {
            upload: uploadTime,
            ocr: modelEndTime - modelStartTime,
            analysis: 0,
            total: modelEndTime - startTime
          },
          documentConfidence: {
            overall: 0,
            confidence: 0,
            groups: {
              delivery_point: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              ppe: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              postal_address: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              buyer_data: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              supplier: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              consumption_info: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
              billing: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 }
            }
          },
          usability: 0,
          status: 'success',
          mappedData: {
            delivery_point: {},
            ppe: {},
            postal_address: {},
            buyer_data: {},
            supplier: {},
            consumption_info: {},
            billing: {}
          }
        };

        results.push(result);

      } catch (error) {
        logger.error('Błąd podczas przetwarzania modelu', {
          sessionId,
          fileName: file.name,
          modelId,
          error
        });
        
        throw error;
      }
    }

    return results;

  } catch (error) {
    logger.error('Błąd podczas przetwarzania pliku', {
      sessionId,
      fileName: file.name,
      error
    });
    
    throw error;
  }
} 