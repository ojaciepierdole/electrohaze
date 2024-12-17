import { ProcessingResult, GroupedResult, ProcessedField, DocumentField } from '@/types/processing';
import { formatDate, formatConsumption } from '@/utils/text-formatting';

type ResultField = DocumentField | ProcessedField;

interface ResultWithFields {
  fileName: string;
  results?: Array<{ fields: Record<string, ResultField>; confidence: number }>;
  modelResults?: Array<{ fields: Record<string, ResultField>; confidence: number }>;
}

function isProcessingResult(result: ProcessingResult | GroupedResult): result is ProcessingResult {
  return 'results' in result;
}

export async function exportResults(results: Array<ProcessingResult | GroupedResult>) {
  try {
    // Przygotuj nagłówki CSV
    const headers = [
      'Nazwa pliku',
      'Data analizy',
      // Dane sprzedawcy
      'Nazwa sprzedawcy',
      'NIP sprzedawcy',
      'Adres sprzedawcy',
      'Konto bankowe',
      'Bank',
      'Email',
      'Telefon',
      'Strona WWW',
      // Dane PPE
      'Numer PPE',
      'Numer licznika',
      'Grupa taryfowa',
      'Numer umowy',
      'Typ umowy',
      'Nazwa produktu',
      'Nazwa OSD',
      'Region OSD',
      // Dane nabywcy
      'Imię nabywcy',
      'Nazwisko nabywcy',
      'Nazwa firmy',
      'NIP',
      'Ulica',
      'Numer budynku',
      'Numer lokalu',
      'Kod pocztowy',
      'Miejscowość',
      'Gmina',
      'Powiat',
      'Województwo',
      // Dane rozliczeniowe
      'Data początkowa',
      'Data końcowa',
      'Zużycie w okresie',
      'Zużycie roczne',
      // Metadane
      'Pewność',
      'Kompletność'
    ];

    // Przygotuj wiersze danych
    const rows = results.map((result) => {
      const fields = result.modelResults[0]?.fields;

      if (!fields) {
        throw new Error(`Brak pól dla pliku ${result.fileName}`);
      }

      const confidence = result.modelResults[0]?.confidence ?? 0;

      const completeness = Object.values(fields)
        .filter((f): f is ResultField => 
          typeof f === 'object' && 
          f !== null && 
          'content' in f && 
          f.content !== null
        ).length / Object.keys(fields).length;

      const getFieldContent = (field: ResultField | undefined): string => {
        if (!field || !('content' in field)) return '';
        return field.content || '';
      };

      return [
        result.fileName,
        new Date().toISOString(),
        // Dane sprzedawcy
        getFieldContent(fields.supplierName),
        getFieldContent(fields.supplierTaxID),
        `${getFieldContent(fields.supplierStreet)} ${getFieldContent(fields.supplierBuilding)} ${getFieldContent(fields.supplierUnit)}, ${getFieldContent(fields.supplierPostalCode)} ${getFieldContent(fields.supplierCity)}`,
        getFieldContent(fields.supplierBankAccount),
        getFieldContent(fields.supplierBankName),
        getFieldContent(fields.supplierEmail),
        getFieldContent(fields.supplierPhone),
        getFieldContent(fields.supplierWebsite),
        // Dane PPE
        getFieldContent(fields.ppeNum),
        getFieldContent(fields.MeterNumber),
        getFieldContent(fields.TariffGroup),
        getFieldContent(fields.ContractNumber),
        getFieldContent(fields.ContractType),
        getFieldContent(fields.ProductName),
        getFieldContent(fields.OSD_name),
        getFieldContent(fields.OSD_region),
        // Dane nabywcy
        getFieldContent(fields.FirstName),
        getFieldContent(fields.LastName),
        getFieldContent(fields.BusinessName),
        getFieldContent(fields.taxID),
        getFieldContent(fields.Street),
        getFieldContent(fields.Building),
        getFieldContent(fields.Unit),
        getFieldContent(fields.PostalCode),
        getFieldContent(fields.City),
        getFieldContent(fields.Municipality),
        getFieldContent(fields.District),
        getFieldContent(fields.Province),
        // Dane rozliczeniowe
        formatDate(getFieldContent(fields.BillingStartDate)),
        formatDate(getFieldContent(fields.BillingEndDate)),
        formatConsumption(fields.BilledUsage && 'content' in fields.BilledUsage && fields.BilledUsage.content ? parseFloat(fields.BilledUsage.content) : null),
        formatConsumption(fields.usage12m && 'content' in fields.usage12m && fields.usage12m.content ? parseFloat(fields.usage12m.content) : null),
        // Metadane
        `${(confidence * 100).toFixed(1)}%`,
        `${(completeness * 100).toFixed(1)}%`
      ];
    });

    // Przygotuj zawartość CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => 
        row.map(value => 
          typeof value === 'string' && value.includes(';') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        ).join(';')
      )
    ].join('\n');

    // Dodaj BOM dla poprawnego kodowania polskich znaków
    const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });

    // Pobierz plik
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analiza_faktur_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Błąd podczas eksportu CSV:', error);
    throw new Error('Nie udało się wyeksportować wyników do CSV');
  }
}

// ... existing code ... 