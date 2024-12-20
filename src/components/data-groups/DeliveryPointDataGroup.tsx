import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface DeliveryPointDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function DeliveryPointDataGroup({ fields, confidence, onEdit }: DeliveryPointDataGroupProps) {
  return (
    <DataGroup
      title="Miejsce dostawy"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 