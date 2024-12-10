'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CorrespondenceData } from '@/types/fields';

const FIELD_MAPPING: Record<keyof CorrespondenceData, string> = {
  paFirstName: 'Imię',
  paLastName: 'Nazwisko',
  paBusinessName: 'Nazwa firmy',
  paTitle: 'Tytuł',
  paStreet: 'Ulica',
  paBuilding: 'Numer domu',
  paUnit: 'Numer lokalu',
  paPostalCode: 'Kod pocztowy',
  paCity: 'Miejscowość'
};

interface CorrespondenceDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export function CorrespondenceDataGroup({ data }: CorrespondenceDataGroupProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium">Adres korespondencyjny</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(FIELD_MAPPING) as Array<keyof CorrespondenceData>).map((key) => (
            data[key] ? (
              <div key={key} className="space-y-1">
                <dt className="text-sm text-gray-500">{FIELD_MAPPING[key]}</dt>
                <dd className="text-sm font-medium">{data[key]}</dd>
              </div>
            ) : null
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 