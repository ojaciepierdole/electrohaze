import type { ProcessedField, FieldGroupKey, LegacyFields, ModernFields } from '@/types/processing';
import { FIELD_GROUPS } from '@/config/fields';

// Funkcja skracająca nazwę pliku
export function truncateFileName(fileName: string | null | undefined, maxLength: number = 40): string {
  if (!fileName) return 'Nieznany plik';
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  const truncated = nameWithoutExt.slice(0, maxLength - 3 - (extension?.length || 0));
  
  return `${truncated}...${extension ? `.${extension}` : ''}`;
}

// Funkcja sprawdzająca czy wszystkie wymagane pola w grupie są wypełnione
export function isGroupComplete(fields: Record<string, ProcessedField>, groupName: FieldGroupKey): boolean {
  const group = FIELD_GROUPS[groupName];
  if (!group) return false;

  return group.requiredFields.every((fieldName: string) => {
    const field = fields[fieldName];
    return field && field.content && field.content !== 'Nie znaleziono';
  });
}

// Funkcja sprawdzająca czy dokument spełnia baseline
export function checkPositiveBaseline(fields: Record<string, ProcessedField>): boolean {
  // Sprawdź czy kluczowe pola są wypełnione z wysoką pewnością
  const requiredFields = ['invoiceNumber', 'invoiceDate', 'totalAmount', 'supplierName'];
  return requiredFields.every(fieldName => {
    const field = fields[fieldName];
    return field && field.content && field.confidence > 0.8;
  });
}

// Funkcja sprawdzająca czy wszystkie pola mają wysoką pewność
export function checkTopScore(fields: Record<string, ProcessedField>): boolean {
  // Sprawdź czy wszystkie znalezione pola mają wysoką pewność
  return Object.values(fields).every(field => 
    field.content === null || field.confidence > 0.9
  );
}

// Funkcja obliczająca procent wypełnienia grupy
export const calculateGroupCompletion = (
  fields: Record<string, ProcessedField>,
  groupKey: FieldGroupKey
): number => {
  const group = FIELD_GROUPS[groupKey];
  if (!group) return 0;

  const groupFields = [...group.fields] as string[];
  const filledFields = groupFields.filter(fieldName => {
    const field = fields[fieldName];
    return field && field.content && field.confidence > 0.7;
  });

  return Math.round((filledFields.length / groupFields.length) * 100);
};

// Funkcja zwracająca kolor dla danego procentu ukończenia
export const getCompletionColor = (completion: number): string => {
  if (completion >= 90) return "text-green-500";
  if (completion >= 70) return "text-blue-500";
  if (completion >= 50) return "text-yellow-500";
  if (completion > 0) return "text-red-500";
  return "text-gray-300";
};

// Konwertuj stary format na nowy
export function convertLegacyToModern(legacy: LegacyFields): ModernFields {
  return {
    // Dane sprzedawcy
    SupplierName: legacy.supplierName || legacy.OSD_name,
    SupplierTaxId: legacy.taxID,
    SupplierRegion: legacy.osdRegion,

    // Dane klienta
    CustomerName: `${legacy.firstName} ${legacy.lastName}`.trim(),
    CustomerTaxId: legacy.taxID,
    CustomerStreet: legacy.paStreet,
    CustomerBuilding: legacy.paBuilding,
    CustomerUnit: legacy.paUnit,
    CustomerCity: legacy.paCity,
    CustomerPostalCode: legacy.paPostalCode,

    // Adres korespondencyjny
    PostalName: `${legacy.firstName} ${legacy.lastName}`.trim(),
    PostalStreet: legacy.paStreet,
    PostalBuilding: legacy.paBuilding,
    PostalUnit: legacy.paUnit,
    PostalCity: legacy.paCity,
    PostalPostalCode: legacy.paPostalCode,

    // Miejsce dostawy
    PPENumber: legacy.ppeNumber,
    DeliveryStreet: legacy.paStreet,
    DeliveryBuilding: legacy.paBuilding,
    DeliveryUnit: legacy.paUnit,
    DeliveryCity: legacy.paCity,
    DeliveryPostalCode: legacy.paPostalCode,
    TariffGroup: legacy.tariffGroup,

    // Dane faktury
    InvoiceNumber: legacy.invoiceNumber,
    InvoiceDate: legacy.invoiceDate,
    DueDate: legacy.dueDate,
    TotalAmount: legacy.totalAmount,
    Currency: legacy.currency,
    InvoiceType: 'Faktura',
    BillingStartDate: legacy.periodStart,
    BillingEndDate: legacy.periodEnd,
    NetAmount: legacy.netAmount,
    VatAmount: legacy.vatAmount,
    VatRate: legacy.vatRate,

    // Dane zużycia
    ConsumptionValue: legacy.consumption,
    ConsumptionUnit: 'kWh',
    Consumption12m: legacy.consumption12m,
    ReadingType: legacy.readingType,

    // Dane produktu
    ProductName: legacy.productName,
    ProductCode: legacy.productCode,
  };
} 