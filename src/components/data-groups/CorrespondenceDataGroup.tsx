'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CorrespondenceData } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';
import { ConfidenceDot } from '@/components/ui/confidence-dot';

const FIELD_GROUPS = {
  podstawowe: {
    paFirstName: 'Imię',
    paLastName: 'Nazwisko',
    paBusinessName: 'Nazwa firmy',
    paTitle: 'Tytuł',
  },
  adres: {
    paStreet: 'Ulica',
    paBuilding: 'Numer budynku',
    paUnit: 'Numer lokalu',
    paPostalCode: 'Kod pocztowy',
    paCity: 'Miejscowość',
  },
  administracyjne: {
    paProvince: 'Województwo',
    paMunicipality: 'Gmina',
    paDistrict: 'Powiat',
  }
} as const;

const FIELD_MAPPING: Record<keyof CorrespondenceData, string> = Object.values(FIELD_GROUPS).reduce(
  (acc, group) => ({ ...acc, ...group }),
  {} as Record<keyof CorrespondenceData, string>
);

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
  const { columns: missingColumns, gridClass: missingGridClass } = React.useMemo(
    () => calculateOptimalColumns(missingFields),
    [missingFields]
  );

  // Oblicz optymalny układ kolumn dla wypełnionych pól
  const filledFields = Object.entries(FIELD_MAPPING)
    .filter(([key]) => data[key as keyof CorrespondenceData]?.content)
    .map(([key, label]) => ({ key, label }));

  const { columns: filledColumns, gridClass: filledGridClass } = React.useMemo(
    () => calculateOptimalColumns(filledFields),
    [filledFields]
  );

  // Formatuj wartości
  const formattedData = React.useMemo(() => {
    const formatted: Record<string, string | null> = {};
    
    console.group('CorrespondenceDataGroup - formatowanie');
    console.log('Dane wejściowe:', data);
    
    for (const [key, value] of Object.entries(data)) {
      console.log(`Przetwarzanie pola ${key}:`, value);
      const content = (value as any)?.content || null;
      
      if (!content) {
        formatted[key] = null;
        continue;
      }

      try {
        if (key === 'paFirstName' || key === 'paLastName' || key === 'paBusinessName' || key === 'paTitle') {
          // Tylko konwersja na wielkie litery, bez formatowania
          formatted[key] = content.toUpperCase();
          console.log(`${key} -> toUpperCase:`, formatted[key]);
        } else if (key === 'paStreet') {
          const withoutPrefix = formatStreet(content);
          formatted[key] = withoutPrefix.toUpperCase();
          console.log(`${key} -> formatStreet + toUpperCase:`, formatted[key]);
        } else if (key === 'paBuilding' || key === 'paUnit') {
          const formattedNumber = formatAddress(content);
          formatted[key] = formattedNumber.toUpperCase();
          console.log(`${key} -> formatAddress + toUpperCase:`, formatted[key]);
        } else if (key === 'paPostalCode') {
          const formattedPostalCode = formatPostalCode(content);
          formatted[key] = formattedPostalCode.toUpperCase();
          console.log(`${key} -> formatPostalCode + toUpperCase:`, formatted[key]);
        } else if (key === 'paCity') {
          const formattedCity = formatCity(content);
          formatted[key] = formattedCity.toUpperCase();
          console.log(`${key} -> formatCity + toUpperCase:`, formatted[key]);
        } else {
          formatted[key] = content.toUpperCase();
          console.log(`${key} -> toUpperCase:`, formatted[key]);
        }
      } catch (error) {
        console.error(`Błąd podczas formatowania pola ${key}:`, error);
        formatted[key] = content.toUpperCase();
      }
    }
    
    console.log('\nWynik końcowy formatowania:', formatted);
    console.groupEnd();
    
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(FIELD_MAPPING).map(([key, label]) => {
              const fieldKey = key as keyof CorrespondenceData;
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
                        const fieldKey = key as keyof CorrespondenceData;
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