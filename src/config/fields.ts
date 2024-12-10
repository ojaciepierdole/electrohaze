import { FileText, User, Home, MapPin, Package, Building, Receipt, type LucideIcon } from 'lucide-react';

export interface FieldGroup {
  name: string;
  description: string;
  fields: readonly string[];
  requiredFields: readonly string[];
  icon: LucideIcon;
}

export const FIELD_GROUPS = {
  invoice_data: {
    name: 'Dane faktury',
    description: 'Podstawowe informacje z faktury',
    fields: ['invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'currency'] as const,
    requiredFields: ['invoiceNumber', 'invoiceDate', 'totalAmount'] as const,
    icon: Receipt
  },
  supplier_data: {
    name: 'Dane sprzedawcy',
    description: 'Informacje o sprzedawcy',
    fields: ['supplierName', 'supplierNIP', 'supplierAddress', 'supplierCity', 'supplierPostalCode'] as const,
    requiredFields: ['supplierName', 'supplierNIP'] as const,
    icon: Building
  },
  customer_data: {
    name: 'Dane klienta',
    description: 'Dane identyfikacyjne klienta',
    fields: ['customerName', 'customerNIP', 'customerPhone', 'customerEmail'] as const,
    requiredFields: ['customerName'] as const,
    icon: User
  }
} as const;

export type FieldGroupKey = keyof typeof FIELD_GROUPS;
export type FieldName = typeof FIELD_GROUPS[FieldGroupKey]['fields'][number];

export const FIELD_LABELS: Record<string, string> = {
  // Dane faktury
  invoiceNumber: 'Numer faktury',
  invoiceDate: 'Data wystawienia',
  dueDate: 'Termin płatności',
  totalAmount: 'Kwota',
  currency: 'Waluta',

  // Dane sprzedawcy
  supplierName: 'Nazwa sprzedawcy',
  supplierNIP: 'NIP sprzedawcy',
  supplierAddress: 'Adres sprzedawcy',
  supplierCity: 'Miasto sprzedawcy',
  supplierPostalCode: 'Kod pocztowy sprzedawcy',

  // Dane klienta
  customerName: 'Nazwa klienta',
  customerNIP: 'NIP klienta',
  customerPhone: 'Telefon',
  customerEmail: 'Email',

  // Adres klienta
  customerStreet: 'Ulica',
  customerHouseNumber: 'Numer domu',
  customerApartmentNumber: 'Numer mieszkania',
  customerCity: 'Miasto',
  customerPostalCode: 'Kod pocztowy',

  // Adres korespondencyjny
  postalStreet: 'Ulica (korespondencyjny)',
  postalHouseNumber: 'Numer domu (korespondencyjny)',
  postalApartmentNumber: 'Numer mieszkania (korespondencyjny)',
  postalCity: 'Miasto (korespondencyjny)',
  postalPostalCode: 'Kod pocztowy (korespondencyjny)',

  // Punkt odbioru
  ppeNumber: 'Numer PPE',
  meterNumber: 'Numer licznika',
  tariffGroup: 'Grupa taryfowa',
  contractNumber: 'Numer umowy'
};

export const CATEGORY_ICONS: Record<FieldGroupKey, { icon: LucideIcon }> = {
  invoice_data: { icon: Receipt },
  supplier_data: { icon: Building },
  customer_data: { icon: User }
}; 