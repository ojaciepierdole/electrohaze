import { 
  Building, User, Mail, MapPin, 
  Gauge, Receipt, FileBarChart, 
  Briefcase, Home, Send, Plug, Building2, LineChart
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FieldGroupKey } from '@/types/fields';

interface FieldGroup {
  name: FieldGroupKey;
  label: string;
  icon: LucideIcon;
  fields: string[];
  requiredFields: string[];
}

// Mapa nazw pól z Azure API na nazwy w aplikacji
export const FIELD_NAME_MAP = {
  // Taryfa
  'Tariff': 'TariffGroup',
  'TariffGroup': 'TariffGroup',
  'tariff': 'TariffGroup',
  'tariffGroup': 'TariffGroup',
  'TariffType': 'TariffGroup',
  
  // Daty rozliczeniowe
  'billingStartDate': 'BillingStartDate',
  'billingEndDate': 'BillingEndDate',
  'BillingPeriodStart': 'BillingStartDate',
  'BillingPeriodEnd': 'BillingEndDate',
  'BillingStart': 'BillingStartDate',
  'BillingEnd': 'BillingEndDate',
  
  // Zużycie
  'billedUsage': 'BilledUsage',
  'usage12m': '12mUsage',
  'ConsumptionValue': 'BilledUsage',
  'AnnualConsumption': '12mUsage',
  'Consumption': 'BilledUsage',
  'YearlyConsumption': '12mUsage',
  
  // PPE
  'PPENumber': 'ppeNum',
  'PointNumber': 'ppeNum',
  'MeterID': 'MeterNumber',
  
  // Adresy
  'StreetName': 'Street',
  'BuildingNumber': 'Building',
  'ApartmentNumber': 'Unit',
  'ZipCode': 'PostalCode',
  'CityName': 'City',
  
  // Sprzedawca
  'VendorName': 'supplierName',
  'SupplierName': 'supplierName',
  'VendorTaxID': 'supplierTaxID',
  'SupplierTaxID': 'supplierTaxID',
  'VendorAddress': 'supplierStreet',
  'SupplierAddress': 'supplierStreet'
} as const;

// Grupy pól
export const FIELD_GROUPS: Record<FieldGroupKey, FieldGroup> = {
  delivery_point: {
    name: 'delivery_point',
    label: 'Punkt Poboru Energii',
    icon: Plug,
    fields: [
      'ppeNum',
      'TariffGroup',
      'dpStreet',
      'dpBuilding',
      'dpUnit',
      'dpPostalCode',
      'dpCity',
      'dpFirstName',
      'dpLastName'
    ],
    requiredFields: ['ppeNum', 'TariffGroup']
  },
  ppe: {
    name: 'ppe',
    label: 'Dane PPE',
    icon: Building2,
    fields: [
      'Street',
      'Building',
      'Unit',
      'PostalCode',
      'City'
    ],
    requiredFields: ['Street', 'Building', 'PostalCode', 'City']
  },
  postal_address: {
    name: 'postal_address',
    label: 'Adres korespondencyjny',
    icon: Mail,
    fields: [
      'paFirstName',
      'paLastName',
      'paTitle',
      'paBusinessName',
      'paStreet',
      'paBuilding',
      'paUnit',
      'paPostalCode',
      'paCity'
    ],
    requiredFields: ['paStreet', 'paBuilding', 'paPostalCode', 'paCity']
  },
  buyer_data: {
    name: 'buyer_data',
    label: 'Dane nabywcy',
    icon: User,
    fields: [
      'FirstName',
      'LastName',
      'BusinessName',
      'taxID',
      'Fortum_zużycie'
    ],
    requiredFields: ['FirstName', 'LastName', 'taxID']
  },
  supplier: {
    name: 'supplier',
    label: 'Sprzedawca',
    icon: Briefcase,
    fields: [
      'supplierName',
      'OSD_name',
      'OSD_region'
    ],
    requiredFields: ['supplierName']
  },
  billing: {
    name: 'billing',
    label: 'Dane rozliczeniowe',
    icon: Receipt,
    fields: [
      'BillingStartDate',
      'BillingEndDate',
      'BilledUsage',
      '12mUsage',
      'InvoiceType',
      'EnergySaleBreakdown',
      'BillBreakdown',
      'ProductName',
      'ReadingType'
    ],
    requiredFields: ['BillingStartDate', 'BillingEndDate', 'BilledUsage']
  },
  consumption_info: {
    name: 'consumption_info',
    label: 'Informacje o zużyciu',
    icon: LineChart,
    fields: [
      'ConsumptionHistory',
      'ConsumptionTrend',
      'PeakUsage'
    ],
    requiredFields: []
  }
};

// Mapowanie nazw pól na polskie etykiety
export const FIELD_LABELS: Record<string, string> = {
  // Dane sprzedawcy
  supplierName: 'Sprzedawca',
  supplierTaxID: 'NIP',
  supplierStreet: 'Ulica',
  supplierBuilding: 'Budynek',
  supplierUnit: 'Lokal',
  supplierPostalCode: 'Kod pocztowy',
  supplierCity: 'Miejscowość',
  supplierBankAccount: 'Numer konta',
  supplierBankName: 'Bank',
  supplierEmail: 'Email',
  supplierPhone: 'Telefon',
  supplierWebsite: 'Strona WWW',
  OSD_name: 'Dystrybutor',
  OSD_region: 'Region',

  // Punkt Poboru Energii
  ppeNum: 'Numer PPE',
  MeterNumber: 'Numer licznika',
  TariffGroup: 'Grupa taryfowa',
  ContractNumber: 'Numer umowy',
  ContractType: 'Typ umowy',
  dpStreet: 'Ulica',
  dpBuilding: 'Budynek',
  dpUnit: 'Lokal',
  dpPostalCode: 'Kod pocztowy',
  dpCity: 'Miejscowość',
  dpMunicipality: 'Gmina',
  dpDistrict: 'Powiat',
  dpProvince: 'Województwo',

  // Dane nabywcy
  FirstName: 'Imię',
  LastName: 'Nazwisko',
  BusinessName: 'Nazwa firmy',
  taxID: 'NIP',
  Street: 'Ulica',
  Building: 'Budynek',
  Unit: 'Lokal',
  PostalCode: 'Kod pocztowy',
  City: 'Miejscowość',
  Municipality: 'Gmina',
  District: 'Powiat',
  Province: 'Województwo',

  // Adres korespondencyjny
  paTitle: 'Tytuł',
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paBusinessName: 'Nazwa firmy',
  paStreet: 'Ulica',
  paBuilding: 'Budynek',
  paUnit: 'Lokal',
  paPostalCode: 'Kod pocztowy',
  paCity: 'Miejscowość',
  paMunicipality: 'Gmina',
  paDistrict: 'Powiat',
  paProvince: 'Województwo',

  // Informacje o zużyciu i rozliczeniach
  BilledUsage: 'Zużycie w okresie',
  ReadingType: 'Typ odczytu',
  '12mUsage': 'Zużycie roczne',
  ConsumptionUnit: 'Jednostka',
  BillingStartDate: 'Okres od',
  BillingEndDate: 'Okres do',
  InvoiceNumber: 'Numer faktury',
  InvoiceDate: 'Data wystawienia',
  DueDate: 'Termin płatności',
  TotalAmount: 'Kwota brutto',
  Currency: 'Waluta',
  InvoiceType: 'Typ dokumentu',
  NetAmount: 'Kwota netto',
  VatAmount: 'Kwota VAT',
  VatRate: 'Stawka VAT',
  BillBreakdown: 'Szczegóły rozliczenia',
  EnergySaleBreakdown: 'Szczegóły sprzedaży',

  // Wartości specjalne
  'b/d': 'Brak danych',
  'n/d': 'Nie dotyczy'
};

// Funkcja pomocnicza do sprawdzania czy pokazać pole
export const shouldShowField = (fieldName: string, vendorName?: string | null) => {
  if (fieldName === 'Fortum_usage') {
    return vendorName?.toLowerCase().includes('fortum') ?? false;
  }
  return true;
};