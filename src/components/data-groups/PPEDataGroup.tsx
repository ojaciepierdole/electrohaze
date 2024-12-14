'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { PPEData, CorrespondenceData, CustomerData } from '@/types/fields';
import { ConfidenceDot } from '@/components/ui/confidence-dot';
import { enrichAddress } from '@/utils/data-processing/enrichment/address';
import { checkAddressCompleteness, suggestCrossFilling } from '@/utils/data-processing/completeness/data-sets';
import { calculateOptimalColumns } from '@/utils/text-formatting';
import { normalizeAddressNumbers } from '@/utils/data-processing/normalizers/address';

const FIELD_GROUPS = {
  identyfikacja: {
    ppeNum: 'Numer PPE',
    MeterNumber: 'Numer licznika',
  },
  umowa: {
    Tariff: 'Grupa taryfowa',
    ContractNumber: 'Numer umowy',
    ContractType: 'Typ umowy',
    ProductName: 'Nazwa produktu',
  },
  osd: {
    OSD_name: 'Nazwa OSD',
    OSD_region: 'Region OSD',
  },
  adres: {
    dpFirstName: 'Imię',
    dpLastName: 'Nazwisko',
    dpStreet: 'Ulica',
    dpBuilding: 'Numer budynku',
    dpUnit: 'Numer lokalu',
    dpPostalCode: 'Kod pocztowy',
    dpCity: 'Miejscowość',
  },
  dodatkowe: {
    EnergySaleBreakdown: 'Rozbicie sprzedaży energii',
    BillBreakdown: 'Rozbicie rachunku',
  }
} as const;

const FIELD_MAPPING: Record<keyof PPEData, string> = Object.values(FIELD_GROUPS).reduce(
  (acc, group) => ({ ...acc, ...group }),
  {} as Record<keyof PPEData, string>
);

interface PPEDataGroupProps {
  data: Partial<PPEData>;
  correspondenceData?: Partial<CorrespondenceData>;
  customerData?: Partial<CustomerData>;
}

export function PPEDataGroup({ data, correspondenceData = {}, customerData = {} }: PPEDataGroupProps) {
  // Przygotuj dane adresowe do przetworzenia
  const addressData = React.useMemo(() => {
    console.group('PPEDataGroup - przygotowanie danych');
    console.log('Dane wejściowe:', {
      dpStreet: data.dpStreet,
      dpBuilding: data.dpBuilding,
      dpUnit: data.dpUnit
    });

    // Najpierw rozdziel numer budynku i mieszkania
    const buildingNumbers = data.dpBuilding ? 
      normalizeAddressNumbers(data.dpBuilding.value || data.dpBuilding.content) :
      { building: null, unit: null };

    console.log('Rozdzielone numery:', buildingNumbers);

    const prepared = {
      ppe: {
        street: data.dpStreet ? {
          content: data.dpStreet.value || data.dpStreet.content,
          confidence: data.dpStreet.confidence
        } : undefined,
        building: buildingNumbers.building ? {
          content: buildingNumbers.building,
          confidence: data.dpBuilding?.confidence || 0
        } : undefined,
        unit: buildingNumbers.unit ? {
          content: buildingNumbers.unit,
          confidence: data.dpBuilding?.confidence || 0
        } : undefined,
        postalCode: data.dpPostalCode ? {
          content: data.dpPostalCode.value || data.dpPostalCode.content,
          confidence: data.dpPostalCode.confidence
        } : undefined,
        city: data.dpCity ? {
          content: data.dpCity.value || data.dpCity.content,
          confidence: data.dpCity.confidence
        } : undefined
      },
      correspondence: {
        street: correspondenceData.paStreet ? {
          content: correspondenceData.paStreet.value || correspondenceData.paStreet.content,
          confidence: correspondenceData.paStreet.confidence
        } : undefined,
        building: correspondenceData.paBuilding ? {
          content: correspondenceData.paBuilding.value || correspondenceData.paBuilding.content,
          confidence: correspondenceData.paBuilding.confidence
        } : undefined,
        unit: correspondenceData.paUnit ? {
          content: correspondenceData.paUnit.value || correspondenceData.paUnit.content,
          confidence: correspondenceData.paUnit.confidence
        } : undefined,
        postalCode: correspondenceData.paPostalCode ? {
          content: correspondenceData.paPostalCode.value || correspondenceData.paPostalCode.content,
          confidence: correspondenceData.paPostalCode.confidence
        } : undefined,
        city: correspondenceData.paCity ? {
          content: correspondenceData.paCity.value || correspondenceData.paCity.content,
          confidence: correspondenceData.paCity.confidence
        } : undefined
      },
      delivery: undefined,
      supplier: undefined
    };

    console.log('Przygotowane dane:', prepared);
    console.groupEnd();

    return prepared;
  }, [data, correspondenceData]);

  // Przetwórz i wzbogać dane adresowe
  const processedAddresses = React.useMemo(() => {
    const processed = enrichAddress(addressData, { confidenceThreshold: 0.3 });
    console.log('Przetworzone adresy:', processed);
    return processed;
  }, [addressData]);

  // Sprawdź kompletność danych
  const completeness = React.useMemo(() => 
    checkAddressCompleteness(processedAddresses)
  , [processedAddresses]);

  // Znajdź sugestie uzupełnień krzyżowych
  const crossFillingSuggestions = React.useMemo(() => 
    suggestCrossFilling(processedAddresses, completeness)
  , [processedAddresses, completeness]);

  // Oblicz statystyki grupy
  const ppeCompleteness = completeness.ppe;
  const isEmpty = ppeCompleteness.completeness === 0;
  const completionPercentage = Math.round(ppeCompleteness.completeness * 100);
  const confidencePercentage = Math.round(ppeCompleteness.confidence * 100);

  // Oblicz optymalny układ kolumn dla brakujących pól
  const { columns: missingColumns, gridClass: missingGridClass } = React.useMemo(
    () => calculateOptimalColumns(ppeCompleteness.missingFields.map(field => ({
      key: field,
      label: FIELD_MAPPING[field as keyof PPEData] || field
    }))),
    [ppeCompleteness.missingFields]
  );

  // Przygotuj sformatowane dane
  const formattedData = React.useMemo(() => {
    const formatted: Record<string, string | null> = {};
    const ppeAddress = processedAddresses.ppe;

    console.group('PPEDataGroup - formatowanie końcowe');
    console.log('Adres PPE po przetworzeniu:', ppeAddress);

    // Dane adresowe
    formatted.dpStreet = ppeAddress.street;
    formatted.dpBuilding = ppeAddress.building;
    formatted.dpUnit = ppeAddress.unit;
    formatted.dpPostalCode = ppeAddress.postalCode;
    formatted.dpCity = ppeAddress.city;

    // Pozostałe pola - tylko UPPERCASE
    for (const [key, value] of Object.entries(data)) {
      if (!['dpStreet', 'dpBuilding', 'dpUnit', 'dpPostalCode', 'dpCity'].includes(key)) {
        formatted[key] = value?.content ? value.content.toUpperCase() : null;
      }
    }

    console.log('Sformatowane dane końcowe:', formatted);
    console.groupEnd();

    return formatted;
  }, [data, processedAddresses]);

  if (isEmpty) {
    return (
      <Card className="bg-gray-50 border-gray-200 opacity-75">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-500">Punkt poboru energii</CardTitle>
            <Badge variant="outline" className="text-gray-500">
              Brak danych
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <p>Brak danych PPE w strukturze faktury tego dostawcy.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Punkt poboru energii</CardTitle>
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
              const fieldKey = key as keyof PPEData;
              const fieldData = data[fieldKey];
              const formattedValue = formattedData[key];
              
              return formattedValue ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm font-medium">{formattedValue}</dd>
                  <ConfidenceDot confidence={fieldData?.confidence || processedAddresses.ppe.confidence} />
                </div>
              ) : null;
            })}
          </div>

          {/* Brakujące pola */}
          {ppeCompleteness.missingFields.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Brakujące dane:</h4>
                <div className={`grid ${missingGridClass} gap-4`}>
                  {missingColumns.map((column, columnIndex) => (
                    <div key={columnIndex} className="space-y-2">
                      {column.map(({ key, label }) => {
                        const suggestion = crossFillingSuggestions.get(`ppe_${key}`);
                        return (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">{label}</span>
                            {suggestion ? (
                              <span className="text-sm text-blue-500">
                                Możliwe uzupełnienie z sekcji {suggestion[0].fromSection}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-300">—</span>
                            )}
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