'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliveryPointData } from '@/types/fields';

const FIELD_MAPPING: Record<keyof DeliveryPointData, string> = {
  dpFirstName: 'Imię',
  dpLastName: 'Nazwisko',
  dpStreet: 'Ulica',
  dpBuilding: 'Numer domu',
  dpUnit: 'Numer lokalu',
  dpPostalCode: 'Kod pocztowy',
  dpCity: 'Miejscowość'
};

interface DeliveryPointDataGroupProps {
  data: Partial<DeliveryPointData>;
}

export function DeliveryPointDataGroup({ data }: DeliveryPointDataGroupProps) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-medium">Punkt dostawy</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(FIELD_MAPPING) as Array<keyof DeliveryPointData>).map((key) => (
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