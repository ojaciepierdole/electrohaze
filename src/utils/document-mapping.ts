// Funkcja mapująca surowe dane do naszej struktury
import type { DocumentAnalysisResult } from '@/types/documentTypes';

export interface MissingFields {
  customerData: string[];
  ppeData: string[];
  correspondenceData: string[];
  billingData: string[];
  supplierData: string[];
}

export function findMissingFields(data: DocumentAnalysisResult): MissingFields {
  const missingFields: MissingFields = {
    customerData: [],
    ppeData: [],
    correspondenceData: [],
    billingData: [],
    supplierData: []
  };

  // Sprawdzanie pól customerData
  const requiredCustomerFields = {
    firstName: 'Imię',
    lastName: 'Nazwisko',
    businessName: 'Nazwa firmy',
    taxId: 'NIP',
    street: 'Ulica',
    building: 'Numer budynku',
    unit: 'Numer lokalu',
    postalCode: 'Kod pocztowy',
    city: 'Miasto'
  };

  Object.entries(requiredCustomerFields).forEach(([key, label]) => {
    if (!data.customerData[key as keyof typeof data.customerData]) {
      missingFields.customerData.push(label);
    }
  });

  // PPE Data
  const requiredPPEFields = {
    ppeNumber: 'Numer PPE',
    tariffGroup: 'Grupa taryfowa',
    productName: 'Nazwa produktu'
  };

  Object.entries(requiredPPEFields).forEach(([key, label]) => {
    if (!data.ppeData[key as keyof typeof data.ppeData]) {
      missingFields.ppeData.push(label);
    }
  });

  // Correspondence Data
  const requiredCorrespondenceFields = {
    firstName: 'Imię',
    lastName: 'Nazwisko',
    street: 'Ulica',
    building: 'Numer budynku',
    postalCode: 'Kod pocztowy',
    city: 'Miasto',
    title: 'Tytuł',
    unit: 'Numer lokalu',
    businessName: 'Nazwa firmy'
  };

  Object.entries(requiredCorrespondenceFields).forEach(([key, label]) => {
    if (!data.correspondenceData[key as keyof typeof data.correspondenceData]) {
      missingFields.correspondenceData.push(label);
    }
  });

  // Billing Data
  const requiredBillingFields = {
    billingStartDate: 'Data początkowa',
    billingEndDate: 'Data końcowa',
    billedUsage: 'Zużycie',
    readingType: 'Typ odczytu',
    invoiceType: 'Typ faktury',
    usage12m: 'Zużycie 12m'
  };

  Object.entries(requiredBillingFields).forEach(([key, label]) => {
    if (!data.billingData[key as keyof typeof data.billingData]) {
      missingFields.billingData.push(label);
    }
  });

  // Supplier Data
  const requiredSupplierFields = {
    supplierName: 'Nazwa sprzedawcy'
  };

  Object.entries(requiredSupplierFields).forEach(([key, label]) => {
    if (!data.supplierData[key as keyof typeof data.supplierData]) {
      missingFields.supplierData.push(label);
    }
  });

  return missingFields;
}

export function mapDocumentAnalysisResult(rawData: any): DocumentAnalysisResult {
  return {
    ppeData: {
      ppeNumber: rawData.ppeNum || '',
      tariffGroup: rawData.Tariff || '',
      productName: rawData.ProductName || '',
      street: rawData.dpStreet || '',
      building: rawData.dpBuilding || '',
      unit: rawData.dpUnit || '',
      city: rawData.dpCity?.replace(',', '') || '',
      osdName: rawData.OSD_name || '',
      osdRegion: rawData.OSD_region || '',
    },
    
    correspondenceData: {
      firstName: rawData.paFirstName || '',
      lastName: rawData.paLastName || '',
      street: rawData.paStreet || '',
      building: rawData.paBuilding || '',
      postalCode: rawData.paPostalCode || '',
      city: rawData.paCity || '',
      title: rawData.paTitle || '',
      unit: rawData.paUnit || '',
      businessName: rawData.paBusinessName || '',
    },

    customerData: {
      firstName: rawData.FirstName || '',
      lastName: rawData.LastName || '',
      businessName: rawData.BusinessName || '',
      taxId: rawData.taxID || '',
      street: rawData.Street || '',
      building: rawData.Building || '',
      unit: rawData.Unit || '',
      postalCode: rawData.PostalCode || '',
      city: rawData.City || '',
    },

    billingData: {
      billingStartDate: rawData.BillingStartDate ? new Date(rawData.BillingStartDate) : new Date(),
      billingEndDate: rawData.BillingEndDate ? new Date(rawData.BillingEndDate) : new Date(),
      billedUsage: parseFloat(rawData.BilledUsage?.replace(',', '.')) || 0,
      readingType: rawData.ReadingType || '',
      invoiceType: rawData.InvoiceType || '',
      energySaleBreakdown: rawData.EnergySaleBreakdown,
      usage12m: rawData['12mUsage'] ? parseFloat(rawData['12mUsage'].replace(',', '.')) : undefined,
      billBreakdown: rawData.BillBreakdown,
    },

    supplierData: {
      supplierName: rawData.supplierName || '',
    }
  };
} 