import { NextResponse } from "next/server";
import { client } from "@/lib/azure-client";
import { Compose2Result } from "@/types/compose2";
import { mapToDisplayData } from "@/lib/compose2-helpers";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    
    const poller = await client.beginAnalyzeDocument(
      "Compose-2",
      buffer
    );

    const result = await poller.pollUntilDone();
    
    if (!result.documents?.[0]) {
      throw new Error("Nie znaleziono dokumentu w wynikach analizy");
    }

    console.log("Available field names:", Object.keys(result.documents[0].fields));

    const doc = result.documents[0];
    
    const mappedFields: Compose2Result = {
      supplierName: {
        type: 'string',
        content: doc.fields?.["supplierName"]?.content || '',
        confidence: doc.fields?.["supplierName"]?.confidence || 0
      },
      firstName: {
        type: 'string',
        content: doc.fields?.["Nabywca.firstName"]?.content || '',
        confidence: doc.fields?.["Nabywca.firstName"]?.confidence || 0
      },
      lastName: {
        type: 'string',
        content: doc.fields?.["Nabywca.lastName"]?.content || '',
        confidence: doc.fields?.["Nabywca.lastName"]?.confidence || 0
      },
      street: {
        type: 'string',
        content: doc.fields?.["Nabywca.street"]?.content || '',
        confidence: doc.fields?.["Nabywca.street"]?.confidence || 0
      },
      building: {
        type: 'string',
        content: doc.fields?.["Nabywca.building"]?.content || '',
        confidence: doc.fields?.["Nabywca.building"]?.confidence || 0
      },
      unit: {
        type: 'string',
        content: doc.fields?.["Nabywca.unit"]?.content || '',
        confidence: doc.fields?.["Nabywca.unit"]?.confidence || 0
      },
      postalCode: {
        type: 'string',
        content: doc.fields?.["Nabywca.postalCode"]?.content || '',
        confidence: doc.fields?.["Nabywca.postalCode"]?.confidence || 0
      },
      city: {
        type: 'string',
        content: doc.fields?.["Nabywca.city"]?.content || '',
        confidence: doc.fields?.["Nabywca.city"]?.confidence || 0
      },
      // Adres korespondencyjny
      paFirstName: {
        type: 'string',
        content: doc.fields?.["paFirstName"]?.content || '',
        confidence: doc.fields?.["paFirstName"]?.confidence || 0
      },
      paLastName: {
        type: 'string',
        content: doc.fields?.["paLastName"]?.content || '',
        confidence: doc.fields?.["paLastName"]?.confidence || 0
      },
      paStreet: {
        type: 'string',
        content: doc.fields?.["paStreet"]?.content || '',
        confidence: doc.fields?.["paStreet"]?.confidence || 0
      },
      paBuilding: {
        type: 'string',
        content: doc.fields?.["paBuilding"]?.content || '',
        confidence: doc.fields?.["paBuilding"]?.confidence || 0
      },
      paUnit: {
        type: 'string',
        content: doc.fields?.["paUnit"]?.content || '',
        confidence: doc.fields?.["paUnit"]?.confidence || 0
      },
      paPostalCode: {
        type: 'string',
        content: doc.fields?.["paPostalCode"]?.content || '',
        confidence: doc.fields?.["paPostalCode"]?.confidence || 0
      },
      paCity: {
        type: 'string',
        content: doc.fields?.["paCity"]?.content || '',
        confidence: doc.fields?.["paCity"]?.confidence || 0
      },
      // Adres dostawy
      dpFirstName: {
        type: 'string',
        content: doc.fields?.["dpFirstName"]?.content || '',
        confidence: doc.fields?.["dpFirstName"]?.confidence || 0
      },
      dpLastName: {
        type: 'string',
        content: doc.fields?.["dpLastName"]?.content || '',
        confidence: doc.fields?.["dpLastName"]?.confidence || 0
      },
      dpStreet: {
        type: 'string',
        content: doc.fields?.["dpStreet"]?.content || '',
        confidence: doc.fields?.["dpStreet"]?.confidence || 0
      },
      dpBuilding: {
        type: 'string',
        content: doc.fields?.["dpBuilding"]?.content || '',
        confidence: doc.fields?.["dpBuilding"]?.confidence || 0
      },
      dpUnit: {
        type: 'string',
        content: doc.fields?.["dpUnit"]?.content || '',
        confidence: doc.fields?.["dpUnit"]?.confidence || 0
      },
      dpPostalCode: {
        type: 'string',
        content: doc.fields?.["dpPostalCode"]?.content || '',
        confidence: doc.fields?.["dpPostalCode"]?.confidence || 0
      },
      dpCity: {
        type: 'string',
        content: doc.fields?.["dpCity"]?.content || '',
        confidence: doc.fields?.["dpCity"]?.confidence || 0
      },
      ppeNum: {
        type: 'string',
        content: doc.fields?.["ppeNum"]?.content || '',
        confidence: doc.fields?.["ppeNum"]?.confidence || 0
      }
    };

    const displayData = mapToDisplayData(mappedFields);
    console.log("Final mapped data:", JSON.stringify(displayData, null, 2));

    return NextResponse.json({ result: displayData });
    
  } catch (error) {
    console.error("Błąd podczas analizy dokumentu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas przetwarzania dokumentu" },
      { status: 500 }
    );
  }
} 