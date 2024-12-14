import { NextResponse } from 'next/server';
import type { DocumentIntelligenceResponse } from '@/types/documentIntelligence';

export async function GET() {
  try {
    // Zwracamy dane w formacie zgodnym z DocumentIntelligenceResponse
    const response: DocumentIntelligenceResponse = { 
      models: [
        { 
          id: "prebuilt-invoice",
          name: "Invoice model",
          description: "Model do analizy faktur"
        },
        { 
          id: "prebuilt-receipt",
          name: "Receipt model", 
          description: "Model do analizy paragonów"
        }
      ]
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 