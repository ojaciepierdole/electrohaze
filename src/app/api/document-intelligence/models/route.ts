import { NextResponse } from 'next/server';
import type { DocumentIntelligenceResponse } from '@/types/documentIntelligence';

export async function GET() {
  try {
    // Zwracamy dane w formacie zgodnym z DocumentIntelligenceResponse
    const response: DocumentIntelligenceResponse = { 
      models: [
        { 
          modelId: "prebuilt-invoice", 
          description: "Invoice model",
          createdOn: new Date()
        },
        { 
          modelId: "prebuilt-receipt", 
          description: "Receipt model",
          createdOn: new Date()
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