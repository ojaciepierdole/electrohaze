'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FieldWithConfidence } from '@/components/FieldWithConfidence';
import { ProcessedDocumentField } from '@/types/processing';
import { FieldType } from '@/types/fields';

interface CustomerDataGroupProps {
  data: {
    FirstName?: ProcessedDocumentField;
    LastName?: ProcessedDocumentField;
    BusinessName?: ProcessedDocumentField;
    taxID?: ProcessedDocumentField;
    Building?: ProcessedDocumentField;
    Unit?: ProcessedDocumentField;
    Street?: ProcessedDocumentField;
    PostalCode?: ProcessedDocumentField;
    City?: ProcessedDocumentField;
  };
  isProcessing: boolean;
}

export function CustomerDataGroup({ data, isProcessing }: CustomerDataGroupProps) {
  const buildingField = data.Building ? {
    name: 'Building',
    value: data.Building.value,
    confidence: data.Building.confidence,
    metadata: {
      fieldType: FieldType.Text,
      transformationType: 'split',
      source: 'derived',
      status: 'success',
    }
  } : undefined;

  const unitField = data.Unit ? {
    name: 'Unit',
    value: data.Unit.value,
    confidence: data.Unit.confidence,
    metadata: {
      fieldType: FieldType.Text,
      transformationType: 'split',
      source: 'derived',
      status: 'success',
    }
  } : undefined;

  const streetField = data.Street ? {
    name: 'Street',
    value: data.Street.value,
    confidence: data.Street.confidence,
    metadata: {
      fieldType: FieldType.Text,
      transformationType: 'split',
      source: 'derived',
      status: 'success',
    }
  } : undefined;

  const postalCodeField = data.PostalCode ? {
    name: 'PostalCode',
    value: data.PostalCode.value,
    confidence: data.PostalCode.confidence,
    metadata: {
      fieldType: FieldType.Text,
      transformationType: 'split',
      source: 'derived',
      status: 'success',
    }
  } : undefined;

  const cityField = data.City ? {
    name: 'City',
    value: data.City.value,
    confidence: data.City.confidence,
    metadata: {
      fieldType: FieldType.Text,
      transformationType: 'split',
      source: 'derived',
      status: 'success',
    }
  } : undefined;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Dane klienta</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.FirstName && (
            <FieldWithConfidence
              label="Imię"
              value={data.FirstName.value}
              confidence={data.FirstName.confidence}
              isProcessing={isProcessing}
            />
          )}
          {data.LastName && (
            <FieldWithConfidence
              label="Nazwisko"
              value={data.LastName.value}
              confidence={data.LastName.confidence}
              isProcessing={isProcessing}
            />
          )}
          {data.BusinessName && (
            <FieldWithConfidence
              label="Nazwa firmy"
              value={data.BusinessName.value}
              confidence={data.BusinessName.confidence}
              isProcessing={isProcessing}
            />
          )}
          {data.taxID && (
            <FieldWithConfidence
              label="NIP"
              value={data.taxID.value}
              confidence={data.taxID.confidence}
              isProcessing={isProcessing}
            />
          )}
          {buildingField && (
            <FieldWithConfidence
              label="Budynek"
              value={buildingField.value}
              confidence={buildingField.confidence}
              isProcessing={isProcessing}
            />
          )}
          {unitField && (
            <FieldWithConfidence
              label="Lokal"
              value={unitField.value}
              confidence={unitField.confidence}
              isProcessing={isProcessing}
            />
          )}
          {streetField && (
            <FieldWithConfidence
              label="Ulica"
              value={streetField.value}
              confidence={streetField.confidence}
              isProcessing={isProcessing}
            />
          )}
          {postalCodeField && (
            <FieldWithConfidence
              label="Kod pocztowy"
              value={postalCodeField.value}
              confidence={postalCodeField.confidence}
              isProcessing={isProcessing}
            />
          )}
          {cityField && (
            <FieldWithConfidence
              label="Miejscowość"
              value={cityField.value}
              confidence={cityField.confidence}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 