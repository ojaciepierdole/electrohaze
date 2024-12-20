import { 
  Building, User, Mail, MapPin, 
  Gauge, Receipt, FileBarChart, 
  Briefcase, Home, Send, Plug
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FieldGroupKey } from '@/types/processing';

interface FieldGroup {
  name: string;
  icon: LucideIcon;
  fields: readonly string[];
  requiredFields: readonly string[];
}

// Mapa nazw pól z Azure API na nazwy w aplikacji
export const FIELD_NAME_MAP = {
  'Tariff': 'TariffGroup',
  'TariffGroup': 'TariffGroup',
  'tariff': 'TariffGroup',
  'tariffGroup': 'TariffGroup',
  'TariffType': 'TariffGroup',
  'billingStartDate': 'BillingStartDate',
  'billingEndDate': 'BillingEndDate',
  'billedUsage': 'BilledUsage',
  'usage12m': '12mUsage',
  'BillingPeriodStart': 'BillingStartDate',
  'BillingPeriodEnd': 'BillingEndDate',
  'ConsumptionValue': 'BilledUsage',
  'AnnualConsumption': '12mUsage',
  'BillingStart': 'BillingStartDate',
  'BillingEnd': 'BillingEndDate',
  'Consumption': 'BilledUsage',
  'YearlyConsumption': '12mUsage'
} as const;

// Grupy pól
export const FIELD_GROUPS: Record<FieldGroupKey, FieldGroup> = {
  buyer_data: {
    name: 'Dane nabywcy',
    icon: User,
    fields: [
      'FirstName',
      'LastName',
      'BusinessName',
      'taxID',
      'Street',
      'Building',
      'Unit',
      'PostalCode',
      'City',
      'Municipality',
      'District',
      'Province'
    ] as const,
    requiredFields: ['FirstName', 'LastName', 'Street', 'Building', 'Unit', 'PostalCode', 'City']
  },

  delivery_point: {
    name: 'Punkt Poboru Energii',
    icon: Plug,
    fields: [
      'ppeNum',
      'MeterNumber',
      'TariffGroup',
      'ContractNumber',
      'ContractType',
      'OSD_name',
      'OSD_region',
      'ProductName'
    ] as const,
    requiredFields: ['ppeNum', 'TariffGroup']
  },

  consumption_info: {
    name: 'Informacje o zużyciu',
    icon: Gauge,
    fields: [
      'BilledUsage',
      'ReadingType',
      '12mUsage',
      'ConsumptionUnit'
    ] as const,
    requiredFields: ['BilledUsage']
  },

  postal_address: {
    name: 'Adres korespondencyjny',
    icon: Send,
    fields: [
      'paTitle',
      'paFirstName',
      'paLastName',
      'paStreet',
      'paBuilding',
      'paUnit',
      'paPostalCode',
      'paCity',
      'Municipality',
      'District',
      'Province'
    ] as const,
    requiredFields: ['paFirstName', 'paLastName','paStreet', 'paBuilding', 'paUnit', 'paPostalCode', 'paCity']
  },

  supplier: {
    name: 'Dane sprzedawcy',
    icon: Building,
    fields: [
      'supplierName',
      'supplierTaxID',
      'supplierStreet',
      'supplierBuilding',
      'supplierUnit',
      'supplierPostalCode',
      'supplierCity',
      'supplierBankAccount',
      'supplierBankName',
      'supplierEmail',
      'supplierPhone',
      'supplierWebsite',
      'OSD_name'
    ] as const,
    requiredFields: ['supplierName']
  },

  billing: {
    name: 'Dane rozliczeniowe',
    icon: Receipt,
    fields: [
      'BillingStartDate',
      'BillingEndDate',
      'InvoiceNumber',
      'InvoiceDate',
      'DueDate',
      'TotalAmount',
      'Currency',
      'InvoiceType',
      'NetAmount',
      'VatAmount',
      'VatRate',
      'BillBreakdown',
      'EnergySaleBreakdown'
    ] as const,
    requiredFields: ['BillingStartDate', 'BillingEndDate']
  }
};

export type FieldName = typeof FIELD_GROUPS[FieldGroupKey]['fields'][number];

// Mapowanie nazw pól na polskie etykiety
export const FIELD_LABELS: Record<string, string> = {
  // Dane sprzedawcy
  supplierName: 'Sprzedawca',
  OSD_name: 'Dystrybutor',
  OSD_region: 'Region',
  BusinessName: 'Nazwa firmy',

  // Punkt Poboru Energii
  ppeNum: 'Numer PPE',
  Title: 'Tytuł',
  FirstName: 'Imię',
  LastName: 'Nazwisko',
  Street: 'Ulica',
  Building: 'Budynek',
  Unit: 'Lokal',
  City: 'Miejscowość',
  PostalCode: 'Kod pocztowy',
  Province: 'Województwo',
  TariffGroup: 'Grupa taryfowa',
  InvoiceType: 'Typ dokumentu',
  taxID: 'NIP',

  // Adres korespondencyjny
  paTitle: 'Tytuł',
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paStreet: 'Ulica',
  paBuilding: 'Budynek',
  paUnit: 'Lokal',
  paPostalCode: 'Kod pocztowy',
  paBusinessName: 'Nazwa firmy',

  // Informacje o zużyciu i rozliczeniach
  ConsumptionValue: 'Naliczone zużycie',
  ConsumptionUnit: 'Jednostka',
  '12mUsage': 'Roczne zużycie',
  ReadingType: 'Typ odczytu',
  BillingStartDate: 'Okres od',
  BillingEndDate: 'Okres do',
  BilledUsage: 'Zużycie w okresie',
  InvoiceNumber: 'Numer faktury',
  InvoiceDate: 'Data wystawienia',
  DueDate: 'Termin płatności',
  TotalAmount: 'Kwota brutto',
  Currency: 'Waluta',
  NetAmount: 'Kwota netto',
  VatAmount: 'Kwota VAT',
  VatRate: 'Stawka VAT',
  BillBreakdown: 'Szczegóły rozliczenia',
  EnergySaleBreakdown: 'Szczegóły sprzedaży',
  Zone1UnitNetPrice: 'Cena netto strefa 1',
  Zone2UnitNetPrice: 'Cena netto strefa 2',
  UnitNetPrice: 'Cena jednostkowa netto',
  ProductName: 'Nazwa produktu',

  // Wartości specjalne
  'b/d': 'Brak danych',
  'n/d': 'Nie dotyczy'
};

// Funkcja pomocnicza do sprawdzania czy pokazać pole Fortum_usage
export const shouldShowField = (fieldName: string, vendorName?: string | null) => {
  if (fieldName === 'Fortum_usage') {
    return vendorName?.toLowerCase().includes('fortum') ?? false;
  }
  return true;
};