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

export const FIELD_GROUPS: Record<FieldGroupKey, FieldGroup> = {
  buyer_data: {
    name: 'Dane nabywcy',
    icon: User,
    fields: [
      'FirstName',
      'LastName',
      'Street',
      'Building',
      'Unit',
      'PostalCode',
      'City'
    ] as const,
    requiredFields: ['FirstName', 'LastName']
  },

  delivery_point: {
    name: 'Punkt Poboru Energii',
    icon: Plug,
    fields: [
      'supplierName',
      'ppeNum',
      'OSD_name',
      'OSD_region',
      'ProductName',
      'dpStreet',
      'dpBuilding',
      'dpUnit',
      'dpPostalCode',
      'dpCity',
      'dpFirstName',
      'dpLastName'
    ] as const,
    requiredFields: ['ppeNum', 'supplierName']
  },

  consumption_info: {
    name: 'Informacje o zużyciu',
    icon: Gauge,
    fields: [
      'Tariff',
      'InvoiceType',
      'BillingStartDate',
      'BillingEndDate',
      'BilledUsage',
      'ReadingType',
      'Usage12m'
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
      'paCity'
    ] as const,
    requiredFields: []
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
  Tariff: 'Taryfa',
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

  // Informacje o zużyciu
  ConsumptionValue: 'Naliczone zużycie',
  ConsumptionUnit: 'Jednostka',
  Usage12m: 'Roczne zużycie',
  ReadingType: 'Typ odczytu',
  BillingStartDate: 'Okres od',
  BillingEndDate: 'Okres do',
  EnergyUsage: 'Zużycie energii',
  BillBreakdown: 'Szczegóły rozliczenia',
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