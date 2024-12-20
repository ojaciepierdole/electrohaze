'use client';

import React from 'react';
import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface SupplierDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function SupplierDataGroup({ fields, confidence, onEdit }: SupplierDataGroupProps) {
  return (
    <DataGroup
      title="Dane sprzedawcy"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 