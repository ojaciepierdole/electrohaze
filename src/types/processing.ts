import { FIELD_GROUPS } from '@/config/fields';

export type FieldGroupKey = 
  | 'buyer_data'
  | 'delivery_point'
  | 'consumption_info'
  | 'postal_address'
  | 'supplier'
  | 'billing';

export interface FieldGroup {
  label: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface FieldDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
}

export interface ProcessedField {
  content: string | null;
  confidence: number;
  type: string;
  page?: number;
  definition: {
    name: string;
    type: string;
    isRequired: boolean;
    description: string;
    group: FieldGroupKey;
  };
}

export interface BatchProcessingStatus {
  isProcessing: boolean;
  currentFileIndex: number;
  currentFileName: string | null;
  currentModelIndex: number;
  currentModelId: string | null;
  fileProgress: number;
  totalProgress: number;
  totalFiles: number;
  results: ProcessingResult[];
  error: string | null;
}

export interface GroupedResult {
  fileName: string;
  modelResults: Array<{
    modelId: string;
    fields: Record<string, ProcessedField>;
    confidence: number;
    pageCount: number;
  }>;
}

export interface ProcessingResult extends GroupedResult {
  processingTime: number;
}

export interface AnalysisField {
  name: string;
  type: string;
  isRequired: boolean;
  description?: string;
  group: FieldGroupKey;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  type: 'prebuilt' | 'custom';
  category: string;
  version?: string;
}

export interface LegacyFields {
  // Podstawowe pola
  OSD_name: string;
  supplierName: string;
  
  // Dane adresowe płatnika
  paStreet: string;
  paBuilding: string;
  paUnit: string;
  paCity: string;
  paPostalCode: string;
  
  // Dane identyfikacyjne
  taxID: string;
  firstName: string;
  lastName: string;
  
  // Punkt poboru
  ppeNumber: string;
  meterNumber: string;
  tariffGroup: string;
  
  // Dane faktury
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  currency: string;

  // Dane zużycia
  consumption: string;
  consumption12m: string;
  readingType: string;
  
  // Okresy rozliczeniowe
  periodStart: string;
  periodEnd: string;
  
  // Dane OSD
  osdRegion: string;
  osdAddress: string;
  
  // Dane produktu
  productName: string;
  productCode: string;
  
  // Dane rozliczeniowe
  netAmount: string;
  vatAmount: string;
  vatRate: string;
}

export interface ModernFields {
  // Dane faktury
  InvoiceNumber: string;    // Numer faktury
  InvoiceDate: string;      // Data wystawienia
  DueDate: string;          // Termin płatności
  TotalAmount: string;      // Kwota do zapłaty
  Currency: string;         // Waluta
  InvoiceType: string;      // Typ dokumentu
  BillingStartDate: string; // Okres od
  BillingEndDate: string;   // Okres do
  NetAmount: string;        // Kwota netto
  VatAmount: string;        // Kwota VAT
  VatRate: string;          // Stawka VAT

  // Dane sprzedawcy energii
  SupplierName: string;     // Nazwa sprzedawcy
  SupplierTaxId: string;    // NIP sprzedawcy
  SupplierRegion: string;   // Region OSD

  // Adres właściwy (główny adres klienta)
  CustomerName: string;     // Nazwa klienta
  CustomerTaxId: string;    // NIP klienta
  CustomerStreet: string;   // Ulica
  CustomerBuilding: string; // Numer budynku
  CustomerUnit: string;     // Numer lokalu
  CustomerCity: string;     // Miejscowość
  CustomerPostalCode: string; // Kod pocztowy

  // Adres korespondencyjny (do wysyłki faktur)
  PostalName: string;       // Nazwa odbiorcy
  PostalStreet: string;     // Ulica
  PostalBuilding: string;   // Numer budynku
  PostalUnit: string;       // Numer lokalu
  PostalCity: string;       // Miejscowość
  PostalPostalCode: string; // Kod pocztowy

  // Miejsce dostawy (punkt poboru energii)
  PPENumber: string;        // Numer punktu poboru energii (PPE)
  DeliveryStreet: string;   // Ulica
  DeliveryBuilding: string; // Numer budynku
  DeliveryUnit: string;     // Numer lokalu
  DeliveryCity: string;     // Miejscowość
  DeliveryPostalCode: string; // Kod pocztowy
  TariffGroup: string;      // Grupa taryfowa

  // Dane o zużyciu energii
  ConsumptionValue: string; // Naliczone zużycie [kWh]
  ConsumptionUnit: string;  // Jednostka zużycia
  Consumption12m: string;   // Zużycie za ostatnie 12 miesięcy
  ReadingType: string;      // Typ odczytu
  
  // Dane produktu
  ProductName: string;      // Nazwa produktu
  ProductCode: string;      // Kod produktu
} 

export interface AddressSet {
  // Podstawowy zestaw danych
  Title?: string;
  FirstName?: string;
  LastName?: string;
  Street?: string;
  Building?: string;
  Unit?: string;
  City?: string;
  PostalCode?: string;

  // Adres korespondencyjny (prefiks 'pa')
  paTitle?: string;
  paFirstName?: string;
  paLastName?: string;
  paStreet?: string;
  paBuilding?: string;
  paUnit?: string;
  paCity?: string;
  paPostalCode?: string;

  // Punkt poboru energii (prefiks 'ppe')
  ppeTitle?: string;
  ppeFirstName?: string;
  ppeLastName?: string;
  ppeStreet?: string;
  ppeBuilding?: string;
  ppeUnit?: string;
  ppeCity?: string;
  ppePostalCode?: string;
  Municipality?: string;
  District?: string;
  Province?: string;

  // Inne pola mogą być dodane w przyszłości
  [key: string]: string | undefined;
} 

export interface AnalysisLogEntry {
  timestamp: Date;
  supplierName: string;
  timings: {
    totalTime: number;
    azureResponseTime: number;
    processingTime: number;
  };
  extractedFields: Record<string, string | null>;
}

export type CombinedFields = Record<FieldGroupKey, Record<string, {
  content: string | null;
  confidence: number;
  confidences: Record<string, number>;
  type: string;
  definition: ProcessedField['definition'];
}>>;

export interface AnalysisResult {
  fileName?: string;
  fileUrl?: string;
  confidence?: number;
  ppeData: {
    ppeNumber?: string;
    meterNumber?: string;
    tariffGroup?: string;
    contractNumber?: string;
    contractType?: string;
    street?: string;
    building?: string;
    unit?: string;
    city?: string;
    confidence?: number;
    osdName?: string;
    osdRegion?: string;
  };
  correspondenceData?: {
    firstName?: string;
    lastName?: string;
    businessName?: string;
    title?: string;
    street?: string;
    building?: string;
    unit?: string;
    postalCode?: string;
    city?: string;
    confidence?: number;
  };
  supplierData?: {
    supplierName?: string;
    taxId?: string;
    street?: string;
    building?: string;
    unit?: string;
    postalCode?: string;
    city?: string;
    bankAccount?: string;
    bankName?: string;
    email?: string;
    phone?: string;
    website?: string;
    osdName?: string;
    osdRegion?: string;
    confidence?: number;
  };
  billingData?: {
    billingStartDate?: string;
    billingEndDate?: string;
    billedUsage?: number;
    usage12m?: number;
    confidence?: number;
  };
  customerData?: {
    firstName?: string;
    lastName?: string;
    businessName?: string;
    taxId?: string;
    confidence?: number;
  };
}