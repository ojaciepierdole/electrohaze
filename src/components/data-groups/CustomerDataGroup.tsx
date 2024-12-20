'use client';

import React from 'react';
import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface CustomerDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function CustomerDataGroup({ fields, confidence, onEdit }: CustomerDataGroupProps) {
  return (
    <DataGroup
      title="Dane klienta"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 