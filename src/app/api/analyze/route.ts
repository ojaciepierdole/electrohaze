import { NextResponse } from "next/server";
import { client } from "@/lib/document-intelligence";
import { type ApiResponse } from "@/types/processing";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const modelId = formData.get("modelId") as string;
    
    if (!file || !modelId) {
      return NextResponse.json(
        { error: "Brak pliku lub ID modelu" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const poller = await client.beginAnalyzeDocument(modelId, arrayBuffer);
    const result = await poller.pollUntilDone();

    if (!result.documents || result.documents.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono dokumentów w pliku" },
        { status: 400 }
      );
    }

    const document = result.documents[0];
    const fields = document.fields || {};
    const supplierName = fields.supplierName?.content || "Nieznany";

    const response: ApiResponse = {
      result: {
        supplierName,
        ...fields
      },
      raw: fields,
      processingTime: poller.getOperationState().createdOn 
        ? Date.now() - poller.getOperationState().createdOn.getTime()
        : 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Błąd podczas przetwarzania dokumentu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas przetwarzania dokumentu" },
      { status: 500 }
    );
  }
} 