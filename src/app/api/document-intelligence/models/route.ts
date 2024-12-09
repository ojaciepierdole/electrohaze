import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Na razie zwróćmy testowe dane
    return NextResponse.json({ 
      models: [
        { modelId: "prebuilt-invoice", description: "Invoice model" },
        { modelId: "prebuilt-receipt", description: "Receipt model" }
      ] 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
} 