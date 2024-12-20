'use client';

import React from 'react';
import { DataField } from '@/components/ui/data-field';
import { DocumentField, GroupConfidence } from '@/types/processing';
import { getFieldValue, getFieldConfidence } from '@/utils/document-fields';

interface PPEDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: GroupConfidence;
  isProcessing?: boolean;
}

export function PPEDataGroup({ fields, confidence, isProcessing = false }: PPEDataGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Punkt Poboru Energii</h4>
        <div className="text-sm text-muted-foreground">
          Kompletność: {Math.round(confidence.completeness * 100)}%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataField
          label="Numer PPE"
          value={getFieldValue(fields.ppeNum)}
          confidence={getFieldConfidence(fields.ppeNum)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Numer licznika"
          value={getFieldValue(fields.MeterNumber)}
          confidence={getFieldConfidence(fields.MeterNumber)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Grupa taryfowa"
          value={getFieldValue(fields.TariffGroup)}
          confidence={getFieldConfidence(fields.TariffGroup)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Numer umowy"
          value={getFieldValue(fields.ContractNumber)}
          confidence={getFieldConfidence(fields.ContractNumber)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Typ umowy"
          value={getFieldValue(fields.ContractType)}
          confidence={getFieldConfidence(fields.ContractType)}
          isProcessing={isProcessing}
        />

        <DataField
          label="Ulica"
          value={getFieldValue(fields.Street)}
          confidence={getFieldConfidence(fields.Street)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Budynek"
          value={getFieldValue(fields.Building)}
          confidence={getFieldConfidence(fields.Building)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Lokal"
          value={getFieldValue(fields.Unit)}
          confidence={getFieldConfidence(fields.Unit)}
          isProcessing={isProcessing}
        />

        <DataField
          label="Kod pocztowy"
          value={getFieldValue(fields.PostalCode)}
          confidence={getFieldConfidence(fields.PostalCode)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Miasto"
          value={getFieldValue(fields.City)}
          confidence={getFieldConfidence(fields.City)}
          isProcessing={isProcessing}
          isRequired
        />

        <DataField
          label="Gmina"
          value={getFieldValue(fields.Municipality)}
          confidence={getFieldConfidence(fields.Municipality)}
          isProcessing={isProcessing}
        />

        <DataField
          label="Powiat"
          value={getFieldValue(fields.District)}
          confidence={getFieldConfidence(fields.District)}
          isProcessing={isProcessing}
        />

        <DataField
          label="Województwo"
          value={getFieldValue(fields.Province)}
          confidence={getFieldConfidence(fields.Province)}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
} 