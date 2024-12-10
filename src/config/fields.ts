import { 
  Receipt, FileText, Building, User, 
  Wallet, Calendar, Zap, Scale,
  Lightbulb, Calculator, FileBarChart, Mail, MapPin, Package
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
  invoice_data: {
    name: 'Dane faktury',
    icon: Receipt,
    fields: [
      'InvoiceNumber',
      'InvoiceDate',
      'DueDate',
      'TotalAmount',
      'Currency',
      'InvoiceType',
      'BillingStartDate',
      'BillingEndDate',
      'NetAmount',
      'VatAmount',
      'VatRate'
    ] as const,
    requiredFields: ['InvoiceNumber', 'InvoiceDate', 'TotalAmount']
  },
  supplier_data: {
    name: 'Dane sprzedawcy',
    icon: Building,
    fields: [
      'SupplierName',
      'SupplierTaxId',
      'SupplierRegion'
    ] as const,
    requiredFields: ['SupplierName', 'SupplierTaxId']
  },
  customer_data: {
    name: 'Dane klienta',
    icon: User,
    fields: [
      'CustomerName',
      'CustomerTaxId',
      'CustomerStreet',
      'CustomerBuilding',
      'CustomerUnit',
      'CustomerCity',
      'CustomerPostalCode'
    ] as const,
    requiredFields: ['CustomerName']
  },
  postal_address: {
    name: 'Adres korespondencyjny',
    icon: Mail,
    fields: [
      'PostalName',
      'PostalStreet',
      'PostalBuilding',
      'PostalUnit',
      'PostalCity',
      'PostalPostalCode'
    ] as const,
    requiredFields: []
  },
  delivery_point: {
    name: 'Miejsce dostawy',
    icon: MapPin,
    fields: [
      'PPENumber',
      'DeliveryStreet',
      'DeliveryBuilding',
      'DeliveryUnit',
      'DeliveryCity',
      'DeliveryPostalCode',
      'TariffGroup'
    ] as const,
    requiredFields: ['PPENumber']
  },
  consumption_data: {
    name: 'Dane zużycia',
    icon: Zap,
    fields: [
      'ConsumptionValue',
      'ConsumptionUnit',
      'Consumption12m',
      'ReadingType'
    ] as const,
    requiredFields: ['ConsumptionValue']
  },
  product_data: {
    name: 'Dane produktu',
    icon: Package,
    fields: [
      'ProductName',
      'ProductCode'
    ] as const,
    requiredFields: []
  }
};

export type FieldName = typeof FIELD_GROUPS[FieldGroupKey]['fields'][number];

// Mapowanie nazw pól na polskie etykiety
export const FIELD_LABELS: Record<string, string> = {
  // Dane faktury
  InvoiceNumber: 'Numer faktury',
  InvoiceDate: 'Data wystawienia',
  DueDate: 'Termin płatności',
  TotalAmount: 'Kwota do zapłaty',
  Currency: 'Waluta',
  InvoiceType: 'Typ dokumentu',
  BillingStartDate: 'Okres od',
  BillingEndDate: 'Okres do',
  NetAmount: 'Kwota netto',
  VatAmount: 'Kwota VAT',
  VatRate: 'Stawka VAT',

  // Dane sprzedawcy
  SupplierName: 'Nazwa sprzedawcy',
  SupplierTaxId: 'NIP',
  SupplierRegion: 'Region OSD',

  // Adres właściwy
  CustomerName: 'Nazwa',
  CustomerTaxId: 'NIP',
  CustomerStreet: 'Ulica',
  CustomerBuilding: 'Numer budynku',
  CustomerUnit: 'Numer lokalu',
  CustomerCity: 'Miejscowość',
  CustomerPostalCode: 'Kod pocztowy',

  // Adres korespondencyjny
  PostalName: 'Nazwa',
  PostalStreet: 'Ulica',
  PostalBuilding: 'Numer budynku',
  PostalUnit: 'Numer lokalu',
  PostalCity: 'Miejscowość',
  PostalPostalCode: 'Kod pocztowy',

  // Miejsce dostawy
  PPENumber: 'Numer PPE',
  DeliveryStreet: 'Ulica',
  DeliveryBuilding: 'Numer budynku',
  DeliveryUnit: 'Numer lokalu',
  DeliveryCity: 'Miejscowość',
  DeliveryPostalCode: 'Kod pocztowy',
  TariffGroup: 'Grupa taryfowa',

  // Dane zużycia
  ConsumptionValue: 'Zużycie',
  ConsumptionUnit: 'Jednostka',
  Consumption12m: 'Zużycie roczne',
  ReadingType: 'Typ odczytu',
  
  // Dane produktu
  ProductName: 'Nazwa produktu',
  ProductCode: 'Kod produktu'
};