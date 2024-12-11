'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { SupplierData } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet, calculateGroupConfidence, getMissingFields, calculateOptimalColumns } from '@/utils/text-formatting';

const FIELD_MAPPING: Record<keyof SupplierData, string> = {
  supplierName: 'Nazwa',
  supplierTaxID: 'NIP',
  supplierStreet: 'Ulica',
  supplierBuilding: 'Numer budynku',
  supplierUnit: 'Numer lokalu',
  supplierPostalCode: 'Kod pocztowy',
  supplierCity: 'Miejscowość',
  supplierBankAccount: 'Numer konta',
  supplierBankName: 'Nazwa banku',
  supplierEmail: 'Email',
  supplierPhone: 'Telefon',
  supplierWebsite: 'Strona WWW',
  OSD_name: 'Nazwa OSD',
  OSD_region: 'Region OSD'
};

interface SupplierDataGroupProps {
  data: Partial<SupplierData>;
}

export function SupplierDataGroup({ data }: SupplierDataGroupProps) {
  // Oblicz statystyki grupy
  const confidence = calculateGroupConfidence(data, 'supplier');
  const missingFields = getMissingFields(data, FIELD_MAPPING);
  const isEmpty = confidence.filledFields === 0;
  const completionPercentage = Math.round((confidence.filledFields / confidence.totalFields) * 100);

  // Formatuj wartości
  const formattedData = {
    ...data,
    supplierName: formatAddress(data.supplierName || null),
    supplierStreet: formatStreet(data.supplierStreet || null),
    supplierBuilding: formatAddress(data.supplierBuilding || null),
    supplierUnit: formatAddress(data.supplierUnit || null),
    supplierPostalCode: formatPostalCode(data.supplierPostalCode || null),
    supplierCity: formatCity(data.supplierCity || null),
    OSD_name: formatAddress(data.OSD_name || null),
    OSD_region: formatAddress(data.OSD_region || null),
  };

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
          <Badge variant="outline">
            {completionPercentage}% kompletności ({confidence.filledFields}/{confidence.totalFields})
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Wypełnione pola */}
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(FIELD_MAPPING) as Array<keyof SupplierData>).map((key) => (
              formattedData[key] ? (
                <div key={key} className="space-y-1">
                  <dt className="text-sm text-gray-500">{FIELD_MAPPING[key]}</dt>
                  <dd className="text-sm font-medium">{formattedData[key]}</dd>
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
                <div className="grid grid-cols-2 gap-2">
                  {missingFields.map(({ key, label }) => (
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