export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    return dateString.split('T')[0];
  } catch {
    return dateString;
  }
}

export function formatConsumption(value: string | null): string | null {
  if (!value) return null;
  try {
    // Usuń wszystkie spacje i zamień przecinki na kropki
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    // Spróbuj przekonwertować na liczbę
    const number = parseFloat(normalized);
    if (isNaN(number)) return value;
    // Formatuj z użyciem polskiej notacji (przecinek jako separator dziesiętny)
    return `${number.toLocaleString('pl-PL', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    })} kWh`;
  } catch {
    return value;
  }
}

export function formatAddress(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

export function formatPersonName(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

export interface GroupConfidence {
  totalFields: number;
  filledFields: number;
  averageConfidence: number;
}

export function calculateGroupConfidence(fields: Record<string, any>): GroupConfidence {
  const totalFields = Object.keys(fields).length;
  const filledFields = Object.values(fields).filter(v => v !== null && v !== undefined).length;
  const confidenceSum = Object.values(fields).reduce((sum, v) => {
    if (typeof v === 'number') return sum + v;
    if (typeof v === 'string' && v.length > 0) return sum + 1;
    return sum;
  }, 0);

  return {
    totalFields,
    filledFields,
    averageConfidence: filledFields > 0 ? confidenceSum / filledFields : 0
  };
}

export function getMissingFields<T extends Record<string, any>>(
  data: T, 
  fieldMappings: Record<string, string>
): Array<{ label: string; key: keyof T }> {
  return Object.entries(fieldMappings)
    .filter(([key]) => !data[key])
    .map(([key, label]) => ({
      label,
      key: key as keyof T
    }));
}

export interface ColumnLayout {
  columns: Array<Array<{ key: string; label: string }>>;
  gridClass: string;
}

export function calculateOptimalColumns(missingFields: Array<{ key: string; label: string }>): ColumnLayout {
  if (missingFields.length === 0) {
    return { columns: [], gridClass: 'grid-cols-1' };
  }

  // Zakładamy, że chcemy mieć 2-4 wiersze w kolumnie
  const targetRowCount = 3;
  // Oblicz optymalną liczbę kolumn
  const columnCount = Math.ceil(missingFields.length / targetRowCount);
  // Ale nie więcej niż 4 kolumny
  const finalColumnCount = Math.min(4, columnCount);
  // Oblicz rzeczywistą liczbę wierszy
  const itemsPerColumn = Math.ceil(missingFields.length / finalColumnCount);

  // Podziel pola na kolumny
  const columns = Array.from({ length: finalColumnCount }, (_, columnIndex) => {
    const start = columnIndex * itemsPerColumn;
    const end = Math.min(start + itemsPerColumn, missingFields.length);
    return missingFields.slice(start, end);
  });

  // Określ klasę CSS dla gridu
  const gridClass = finalColumnCount === 1 ? 'grid-cols-1' :
                   finalColumnCount === 2 ? 'grid-cols-2' :
                   finalColumnCount === 3 ? 'grid-cols-3' :
                   'grid-cols-4';

  return { columns, gridClass };
} 