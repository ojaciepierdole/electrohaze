'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { SupplierData } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet, formatSupplierName, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';
import { ConfidenceDot } from '@/components/ui/confidence-dot';

// Pola pogrupowane tematycznie w logicznej kolejności
const FIELD_GROUPS = {
  podstawowe: {
    supplierName: 'Nazwa',
    supplierTaxID: 'NIP',
  },
  adres: {
    supplierStreet: 'Ulica',
    supplierBuilding: 'Numer budynku',
    supplierUnit: 'Numer lokalu',
    supplierPostalCode: 'Kod pocztowy',
    supplierCity: 'Miejscowość',
  },
  kontakt: {
    supplierEmail: 'Email',
    supplierPhone: 'Telefon',
    supplierWebsite: 'Strona WWW',
  },
  bankowe: {
    supplierBankAccount: 'Numer konta',
    supplierBankName: 'Nazwa banku',
  },
  osd: {
    OSD_name: 'Nazwa OSD',
  }
} as const;

// Połącz wszystkie pola w jeden obiekt zachowując kolejność grup
const FIELD_MAPPING: Record<keyof SupplierData, string> = Object.values(FIELD_GROUPS).reduce(
  (acc, group) => ({ ...acc, ...group }),
  {}
);

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
}

export function SupplierDataGroup({ data }: SupplierDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'supplier');
  const isEmpty = confidence.filledFields === 0;
  const completionPercentage = Math.round((confidence.filledFields / confidence.totalFields) * 100);
  const confidencePercentage = Math.round(confidence.averageConfidence * 100);

  // Oblicz brakujące pola
  const missingFields = getMissingFields(data, FIELD_MAPPING);

  // Oblicz optymalny układ kolumn dla brakujących pól
  const { columns: missingColumns, gridClass: missingGridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields),
    [missingFields]
  );

  // Formatuj wartości
  const formattedData = React.useMemo(() => {
    const formatted: Record<string, string | null> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'supplierName') {
        formatted[key] = formatSupplierName((value as any)?.content || null);
      } else if (key === 'supplierStreet') {
        formatted[key] = formatStreet((value as any)?.content || null);
      } else if (key === 'supplierBuilding' || key === 'supplierUnit') {
        formatted[key] = formatAddress((value as any)?.content || null);
      } else if (key === 'supplierPostalCode') {
        formatted[key] = formatPostalCode((value as any)?.content || null);
      } else if (key === 'supplierCity') {
        formatted[key] = formatCity((value as any)?.content || null);
      } else if (key === 'OSD_name') {
        formatted[key] = formatSupplierName((value as any)?.content || null);
      } else {
        formatted[key] = (value as any)?.content || null;
      }
    }
    
    return formatted;
  }, [data]);

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Dane sprzedawcy</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych sprzedawcy w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Dane sprzedawcy</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completionPercentage}% kompletności
            </Badge>
            <Badge variant={confidencePercentage > 80 ? "success" : confidencePercentage > 60 ? "warning" : "destructive"}>
              {confidencePercentage}% pewności
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(FIELD_MAPPING).map(([key, label]) => {
              const fieldKey = key as keyof SupplierData;
              const fieldData = data[fieldKey];
              return fieldData?.content ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium">{formattedData[key]}</dd>
                  <ConfidenceDot confidence={fieldData.confidence || 1} />
                </div>
              ) : null;
            })}
          </div>

          {/* Brakujące pola */}
          {missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className={`grid ${missingGridClass} gap-4`}>
                  {missingColumns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }) => {
                        const fieldKey = key as keyof SupplierData;
                        const fieldData = data[fieldKey];
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{label}</span>
                            <span className="text-sm text-gray-300">—</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 