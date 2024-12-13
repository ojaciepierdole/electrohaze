'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CorrespondenceData } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet, formatPersonName, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';
import { ConfidenceDot } from '@/components/ui/confidence-dot';

const FIELD_MAPPING: Record<keyof CorrespondenceData, string> = {
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paBusinessName: 'Nazwa firmy',
  paTitle: 'Tytuł',
  paStreet: 'Ulica',
  paBuilding: 'Numer budynku',
  paUnit: 'Numer lokalu',
  paPostalCode: 'Kod pocztowy',
  paCity: 'Miejscowość'
};

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export function CorrespondenceDataGroup({ data }: CorrespondenceDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'postal_address');
  const isEmpty = confidence.filledFields === 0;
  const completionPercentage = Math.round((confidence.filledFields / confidence.totalFields) * 100);
  const confidencePercentage = Math.round(confidence.averageConfidence * 100);

  // Oblicz brakujące pola
  const missingFields = getMissingFields(data, FIELD_MAPPING);

  // Oblicz optymalny układ kolumn dla brakujących pól
  const { columns, gridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields),
    [missingFields]
  );

  // Formatuj wartości
  const formattedData = React.useMemo(() => {
    const formatted: Record<string, string | null> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'paFirstName' || key === 'paLastName' || key === 'paBusinessName' || key === 'paTitle') {
        formatted[key] = formatPersonName((value as any)?.content || null);
      } else if (key === 'paStreet') {
        formatted[key] = formatStreet((value as any)?.content || null);
      } else if (key === 'paBuilding' || key === 'paUnit') {
        formatted[key] = formatAddress((value as any)?.content || null);
      } else if (key === 'paPostalCode') {
        formatted[key] = formatPostalCode((value as any)?.content || null);
      } else if (key === 'paCity') {
        formatted[key] = formatCity((value as any)?.content || null);
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
            <CardTitle className="text-lg font-medium text-gray-500">Adres korespondencyjny</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak adresu korespondencyjnego w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Adres korespondencyjny</CardTitle>
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
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(FIELD_MAPPING).map((key) => (
              data[key as keyof CorrespondenceData]?.content ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{FIELD_MAPPING[key as keyof CorrespondenceData]}</dt>
                  <dd className="text-sm font-medium">{formattedData[key]}</dd>
                  <ConfidenceDot confidence={data[key as keyof CorrespondenceData]?.confidence || 1} />
                </div>
              ) : null
            ))}
          </div>

          {/* Brakujące pola */}
          {missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className={`grid ${gridClass} gap-4`}>
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }) => {
                        const fieldKey = key as keyof CorrespondenceData;
                        const fieldData = data[fieldKey];
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">{label}</span>
                              <span className="text-sm text-gray-300">—</span>
                            </div>
                            {fieldData && <ConfidenceDot confidence={fieldData.confidence || 0} />}
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