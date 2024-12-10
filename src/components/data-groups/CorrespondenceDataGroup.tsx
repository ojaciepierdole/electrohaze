'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { CorrespondenceData } from '@/types/fields';
import { formatPersonName, formatAddress, calculateGroupConfidence, getMissingFields } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<string, string> = {
  // Dane osobowe
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paBusinessName: 'Nazwa firmy',
  paTitle: 'Tytuł',
  // Dane adresowe
  paStreet: 'Ulica',
  paBuilding: 'Numer budynku',
  paUnit: 'Numer lokalu',
  paPostalCode: 'Kod pocztowy',
  paCity: 'Miejscowość',
  // Dane administracyjne
  Municipality: 'Gmina',
  District: 'Powiat',
  Province: 'Województwo'
};

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export function CorrespondenceDataGroup({ data }: CorrespondenceDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data);
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;

  // Formatuj wartości
  const formattedData = {
    ...data,
    paFirstName: formatPersonName(data.paFirstName || null),
    paLastName: formatPersonName(data.paLastName || null),
    paBusinessName: formatPersonName(data.paBusinessName || null),
    paStreet: formatAddress(data.paStreet || null),
    paCity: formatAddress(data.paCity || null),
    Municipality: formatAddress(data.Municipality || null),
    District: formatAddress(data.District || null),
    Province: formatAddress(data.Province || null),
  };

  // Podziel brakujące pola na dwie kolumny
  const missingFieldsColumns = React.useMemo(() => {
    const midPoint = Math.ceil(missingFields.length / 2);
    return [
      missingFields.slice(0, midPoint),
      missingFields.slice(midPoint)
    ];
  }, [missingFields]);

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
          <Badge variant="outline">
            {Math.round(confidence.averageConfidence * 100)}% kompletności
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Wypełnione pola */}
          <div className="space-y-2">
            {Object.entries(FIELD_MAPPING).map(([key, label]) => (
              formattedData[key as keyof CorrespondenceData] ? (
                <div key={key} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-gray-500 min-w-[150px]">{label}</dt>
                  <dd className="text-sm font-medium flex-1">
                    {formattedData[key as keyof CorrespondenceData]}
                  </dd>
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
                <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                  {missingFieldsColumns[0].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300">—</span>
                    </div>
                  ))}
                  {missingFieldsColumns[1].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300">—</span>
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