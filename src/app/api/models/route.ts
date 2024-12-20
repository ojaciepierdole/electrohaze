import { NextResponse } from 'next/server';
import type { Model } from '@/types/models';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { Logger } from '@/lib/logger';

const logger = Logger.getInstance();

async function getModelsFromAzure(): Promise<Model[]> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.replace(/\/$/, '');
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error('Brak konfiguracji Azure Document Intelligence');
  }

  const response = await fetch(
    `${endpoint}/documentintelligence/documentModels?api-version=2023-10-31-preview`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': key
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Błąd pobierania modeli: ${response.statusText}`);
  }

  const { value: modelsList } = await response.json();

  return modelsList.map((model: any) => ({
    id: model.modelId,
    name: model.description || model.modelId,
    description: model.description || '',
    fields: [], // TODO: Dodać pobieranie pól
    version: '1.0',
    isCustom: !model.modelId.startsWith('prebuilt-'),
    status: 'ready' as const
  }));
}

export async function GET() {
  try {
    logger.info('Pobieranie modeli z Azure');
    const models = await getModelsFromAzure();
    logger.info('Pobrano modele', { count: models.length });
    return NextResponse.json(models);
  } catch (error) {
    logger.error('Błąd podczas pobierania modeli', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nieznany błąd' },
      { status: 500 }
    );
  }
} 