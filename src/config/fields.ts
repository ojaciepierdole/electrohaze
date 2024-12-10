import { 
  Building, User, Mail, MapPin, 
  Gauge, Receipt, FileBarChart, 
  Briefcase, Home, Send
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
  supplier_data: {
    name: 'Dane sprzedawcy',
    icon: Briefcase,
    fields: [
      'supplierName',
      'OSD_name',
      'OSD_region'
    ] as const,
    requiredFields: ['supplierName']
  },

  delivery_point: {
    name: 'Punkt poboru',
    icon: MapPin,
    fields: [
      'ppeNum',
      'dpStreet',
      'dpBuilding',
      'dpUnit',
      'dpCity',
      'dpPostalCode',
      'Tariff'
    ] as const,
    requiredFields: ['ppeNum', 'Tariff']
  },

  business_data: {
    name: 'Dane biznesowe',
    icon: FileBarChart,
    fields: [
      'FirstName',
      'LastName',
      'BusinessName',
      'taxID',
      'InvoiceType'
    ] as const,
    requiredFields: ['BusinessName']
  },

  primary_address: {
    name: 'Adres podstawowy',
    icon: Home,
    fields: [
      'Street',
      'Building',
      'Unit',
      'City',
      'PostalCode'
    ] as const,
    requiredFields: ['Street', 'Building', 'City', 'PostalCode']
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
      'paCity',
      'paPostalCode'
    ] as const,
    requiredFields: []
  },

  consumption_info: {
    name: 'Informacje o zużyciu',
    icon: Gauge,
    fields: [
      'ConsumptionValue',
      'ConsumptionUnit',
      'Usage12m',
      'ReadingType',
      'BillingStartDate',
      'BillingEndDate'
    ] as const,
    requiredFields: ['ConsumptionValue']
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

  // Dane biznesowe
  FirstName: 'Imię',
  LastName: 'Nazwisko',
  ppeNum: 'Numer PPE',
  dpStreet: 'Ulica',
  dpBuilding: 'Budynek',
  dpUnit: 'Lokal',
  dpCity: 'Miejscowość',
  Tariff: 'Taryfa',
  InvoiceType: 'Typ dokumentu',
  taxID: 'NIP',

  // Adres podstawowy
  Street: 'Ulica',
  Building: 'Budynek',
  Unit: 'Lokal',
  City: 'Miejscowość',
  PostalCode: 'Kod pocztowy',

  // Adres korespondencyjny
  paTitle: 'Tytuł',
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paStreet: 'Ulica',
  paBuilding: 'Budynek',
  paUnit: 'Lokal',
  paCity: 'Miejscowość',
  paPostalCode: 'Kod pocztowy',
  paBusinessName: 'Nazwa firmy',

  // Informacje o zużyciu
  ConsumptionValue: 'Zużycie za okres',
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