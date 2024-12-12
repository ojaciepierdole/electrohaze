// Definicje typów dla danych z Document Intelligence

interface DocumentAnalysisResult {
  // Dane PPE
  ppeData: {
    ppeNumber: string;       // 590380100001247851
    tariffGroup: string;     // G11
    productName: string;     // G11 TARYFA KOMPLEKSOWA
    street: string;          // Wilcza (dpStreet)
    building: string;        // 55/63 (dpBuilding)
    unit: string;           // 85 (dpUnit)
    city: string;           // Warszawa (dpCity)
    osdName: string;        // Nazwa OSD
    osdRegion: string;      // Region OSD
  };

  // Dane korespondencyjne
  correspondenceData: {
    firstName: string;       // Agnieszka (paFirstName)
    lastName: string;        // Wesołowska (paLastName)
    street: string;         // Syriusza (paStreet)
    building: string;       // 8 (paBuilding)
    postalCode: string;     // 80-299 (paPostalCode)
    city: string;          // Gdańsk (paCity)
    title: string;         // paTitle
    unit: string;          // paUnit
    businessName: string;   // paBusinessName
  };

  // Dane klienta
  customerData: {
    firstName: string;
    lastName: string;
    businessName: string;
    taxId: string;
    street: string;
    building: string;
    unit: string;
    postalCode: string;
    city: string;
  };

  // Dane rozliczeniowe
  billingData: {
    billingStartDate: Date;
    billingEndDate: Date;
    billedUsage: number;
    readingType: string;
    invoiceType: string;
    energySaleBreakdown?: string;
    usage12m?: number;
    billBreakdown?: string;
  };

  // Dane dostawcy
  supplierData: {
    supplierName: string;
  };
}

export type { DocumentAnalysisResult }; 