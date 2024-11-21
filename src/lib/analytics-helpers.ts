interface FieldAnalysis {
  name: string;
  value: string | null;
  confidence: number;
  isSuccess: boolean;
}

interface DocumentAnalysis {
  fields: FieldAnalysis[];
  successRate: number;
  timestamp: Date;
}

export interface AnalyticsStats {
  totalDocuments: number;
  totalFields: number;
  successfulFields: number;
  successRate: number;
  fieldsRanking: {
    fieldName: string;
    successCount: number;
    totalCount: number;
    successRate: number;
  }[];
}

export const processAnalyticsData = (analysisResult: any) => {
  // Tutaj logika przetwarzania danych z analizy PDF
  const stats: AnalyticsStats = {
    totalDocuments: 1, // Inkrementujemy przy każdej analizie
    totalFields: 0,
    successfulFields: 0,
    successRate: 0,
    fieldsRanking: []
  };

  // Zliczamy pola
  const fields = Object.entries(analysisResult);
  stats.totalFields = fields.length;
  stats.successfulFields = fields.filter(([_, value]) => value !== null && value !== undefined).length;
  stats.successRate = (stats.successfulFields / stats.totalFields) * 100;

  // Tworzymy ranking pól
  stats.fieldsRanking = fields.map(([fieldName, value]) => ({
    fieldName,
    successCount: value ? 1 : 0,
    totalCount: 1,
    successRate: value ? 100 : 0
  }));

  return stats;
};

export class AnalyticsManager {
  private sessionDocuments: DocumentAnalysis[] = [];
  private fieldsStats: Map<string, { success: number; total: number }> = new Map();

  async analyzeDocument(file: File): Promise<DocumentAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/analyze/full', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Analiza dokumentu nie powiodła się');
    }

    const result = await response.json();
    const analysis = this.processAnalysisResult(result);
    
    this.sessionDocuments.push(analysis);
    this.updateFieldsStats(analysis);

    return analysis;
  }

  private processAnalysisResult(result: any): DocumentAnalysis {
    const fields = Object.entries(result.fields).map(([name, data]: [string, any]) => ({
      name,
      value: data.content || null,
      confidence: data.confidence || 0,
      isSuccess: Boolean(data.content && data.confidence > 0.5)
    }));

    const successCount = fields.filter(f => f.isSuccess).length;
    const successRate = (successCount / fields.length) * 100;

    return {
      fields,
      successRate,
      timestamp: new Date()
    };
  }

  private updateFieldsStats(analysis: DocumentAnalysis) {
    analysis.fields.forEach(field => {
      const stats = this.fieldsStats.get(field.name) || { success: 0, total: 0 };
      stats.total++;
      if (field.isSuccess) stats.success++;
      this.fieldsStats.set(field.name, stats);
    });
  }

  getSessionStats() {
    const totalDocuments = this.sessionDocuments.length;
    const allFields = this.sessionDocuments.flatMap(d => d.fields);
    const successfulFields = allFields.filter(f => f.isSuccess);

    const fieldsRanking = Array.from(this.fieldsStats.entries()).map(([fieldName, stats]) => ({
      fieldName,
      successCount: stats.success,
      totalCount: stats.total,
      successRate: (stats.success / stats.total) * 100
    }));

    return {
      totalDocuments,
      totalFields: allFields.length,
      successfulFields: successfulFields.length,
      successRate: (successfulFields.length / allFields.length) * 100,
      fieldsRanking
    };
  }
}

// Zaktualizowane etykiety bez "(ogólne)"
export const availableFields = [
  // Dane sprzedawcy
  { key: 'supplierName', label: 'Nazwa sprzedawcy', category: 'Sprzedawca' },
  
  // Dane faktury
  { key: 'InvoiceType', label: 'Typ faktury', category: 'Faktura' },
  { key: 'BillingStartDate', label: 'Data rozpoczęcia okresu', category: 'Faktura' },
  { key: 'BillingEndDate', label: 'Data zakończenia okresu', category: 'Faktura' },
  { key: 'BilledUsage', label: 'Zużycie w okresie', category: 'Zużycie' },
  { key: '12mUsage', label: 'Zużycie 12-miesięczne', category: 'Zużycie' },
  { key: 'ReadingType', label: 'Typ odczytu', category: 'Zużycie' },
  { key: 'ProductName', label: 'Nazwa produktu', category: 'Produkt' },
  { key: 'Tariff', label: 'Taryfa', category: 'Produkt' },
  
  // Dane punktu dostawy (dp - delivery point)
  { key: 'ppeNum', label: 'Numer PPE', category: 'Punkt dostawy' },
  { key: 'dpFirstName', label: 'Imię', category: 'Punkt dostawy' },
  { key: 'dpLastName', label: 'Nazwisko', category: 'Punkt dostawy' },
  { key: 'dpBusinessName', label: 'Nazwa firmy', category: 'Punkt dostawy' },
  { key: 'dpStreet', label: 'Ulica', category: 'Punkt dostawy' },
  { key: 'dpBuilding', label: 'Numer budynku', category: 'Punkt dostawy' },
  { key: 'dpUnit', label: 'Numer lokalu', category: 'Punkt dostawy' },
  { key: 'dpCity', label: 'Miasto', category: 'Punkt dostawy' },
  { key: 'dpPostalCode', label: 'Kod pocztowy', category: 'Punkt dostawy' },
  
  // Dane płatnika (pa - payment address)
  { key: 'paFirstName', label: 'Imię', category: 'Płatnik' },
  { key: 'paLastName', label: 'Nazwisko', category: 'Płatnik' },
  { key: 'paBusinessName', label: 'Nazwa firmy', category: 'Płatnik' },
  { key: 'paStreet', label: 'Ulica', category: 'Płatnik' },
  { key: 'paBuilding', label: 'Numer budynku', category: 'Płatnik' },
  { key: 'paUnit', label: 'Numer lokalu', category: 'Płatnik' },
  { key: 'paCity', label: 'Miasto', category: 'Płatnik' },
  { key: 'paPostalCode', label: 'Kod pocztowy', category: 'Płatnik' },
  
  // Dane ogólne - zaktualizowane etykiety
  { key: 'FirstName', label: 'Imię', category: 'Dane ogólne' },
  { key: 'LastName', label: 'Nazwisko', category: 'Dane ogólne' },
  { key: 'BusinessName', label: 'Nazwa firmy', category: 'Dane ogólne' },
  { key: 'Street', label: 'Ulica', category: 'Dane ogólne' },
  { key: 'Building', label: 'Numer budynku', category: 'Dane ogólne' },
  { key: 'Unit', label: 'Numer lokalu', category: 'Dane ogólne' },
  { key: 'City', label: 'Miasto', category: 'Dane ogólne' },
  { key: 'PostalCode', label: 'Kod pocztowy', category: 'Dane ogólne' },
  { key: 'taxID', label: 'NIP', category: 'Dane ogólne' }
];

// Grupowanie pól według kategorii
export const fieldsByCategory = availableFields.reduce((acc, field) => {
  if (!acc[field.category]) {
    acc[field.category] = [];
  }
  acc[field.category].push(field);
  return acc;
}, {} as Record<string, typeof availableFields>);

// Dodaj nowe interfejsy
export interface AnalysisTimings {
  totalTime: number;
  azureResponseTime: number;
  processingTime: number;
}

export interface AnalysisLogEntry {
  timestamp: Date;
  supplierName: string;
  timings: AnalysisTimings;
  extractedFields: Record<string, string | null>;
}

export interface SupplierStats {
  totalDocuments: number;
  contractReadyDocuments: number;
  avgTotalTime: number;
  avgAzureResponseTime: number;
  avgProcessingTime: number;
  successRates: Record<string, {
    success: number;
    total: number;
    rate: number;
  }>;
  readyForContractRate?: number;
}

// Funkcja do obliczania statystyk per dostawca
export const calculateSupplierStats = (logs: AnalysisLogEntry[]): Record<string, SupplierStats> => {
  return logs.reduce((acc, log) => {
    const supplier = log.supplierName || 'Nieznany';
    
    if (!acc[supplier]) {
      acc[supplier] = {
        totalDocuments: 0,
        contractReadyDocuments: 0,
        avgTotalTime: 0,
        avgAzureResponseTime: 0,
        avgProcessingTime: 0,
        successRates: {}
      };
    }

    const stats = acc[supplier];
    stats.totalDocuments++;
    
    // Aktualizuj średnie czasy
    stats.avgTotalTime = updateAverage(stats.avgTotalTime, log.timings.totalTime, stats.totalDocuments);
    stats.avgAzureResponseTime = updateAverage(stats.avgAzureResponseTime, log.timings.azureResponseTime, stats.totalDocuments);
    stats.avgProcessingTime = updateAverage(stats.avgProcessingTime, log.timings.processingTime, stats.totalDocuments);

    // Aktualizuj statystyki pól
    Object.entries(log.extractedFields).forEach(([field, value]) => {
      if (!stats.successRates[field]) {
        stats.successRates[field] = { success: 0, total: 0, rate: 0 };
      }
      stats.successRates[field].total++;
      if (value !== null) {
        stats.successRates[field].success++;
      }
      stats.successRates[field].rate = stats.successRates[field].success / stats.successRates[field].total;
    });

    return acc;
  }, {} as Record<string, SupplierStats>);
};

export const updateAverage = (currentAvg: number, newValue: number, count: number): number => {
  return (currentAvg * (count - 1) + newValue) / count;
};

export const getSupplierDomain = (supplierName: string): string => {
  if (!supplierName) return '';
  
  // Mapowanie nazw dostawców na domeny
  const domainMap: Record<string, string> = {
    'E.ON': 'eon.pl',
    'E.ON Polska': 'eon.pl',
    'ENEA': 'enea.pl',
    'PGE': 'pge.pl',
    'TAURON': 'tauron.pl',
    'Energa': 'energa.pl'
  };

  // Znajdź pasującą domenę
  const matchedSupplier = Object.keys(domainMap).find(
    name => supplierName.toLowerCase().includes(name.toLowerCase())
  );

  return matchedSupplier ? domainMap[matchedSupplier] : '';
};

export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

// Dodaj funkcję sprawdzającą możliwość umowy
export const canCreateContract = (fields: Record<string, string | null>): boolean => {
  // Sprawdź czy pola nie są null/undefined i nie są pustymi stringami
  const hasName = Boolean(fields.FirstName?.trim() && fields.LastName?.trim());
  const hasAddress = (
    Boolean(fields.Street?.trim() && fields.Building?.trim() && fields.City?.trim() && fields.PostalCode?.trim()) ||
    Boolean(fields.paStreet?.trim() && fields.paBuilding?.trim() && fields.paCity?.trim() && fields.paPostalCode?.trim())
  );
  const hasPPE = Boolean(fields.ppeNum?.trim());

  return hasName && hasAddress && hasPPE;
};

export const calculateSuccessRate = (stats: SupplierStats): number => {
  const rates = Object.values(stats.successRates);
  if (rates.length === 0) return 0;
  
  const totalSuccess = rates.reduce((acc, rate) => acc + rate.success, 0);
  const totalFields = rates.reduce((acc, rate) => acc + rate.total, 0);
  
  return totalFields > 0 ? (totalSuccess / totalFields) * 100 : 0;
};

// Zaktualizuj funkcję sprawdzającą kompletność danych
export const hasRequiredFields = (fields: Record<string, string | null>): boolean => {
  const hasPPE = Boolean(fields.ppeNum?.trim());
  const hasName = Boolean(fields.FirstName?.trim() && fields.LastName?.trim());
  const hasAddress = Boolean(
    fields.Street?.trim() && 
    fields.Building?.trim() && 
    fields.City?.trim() && 
    fields.PostalCode?.trim()
  );

  return hasPPE && hasName && hasAddress;
};
  