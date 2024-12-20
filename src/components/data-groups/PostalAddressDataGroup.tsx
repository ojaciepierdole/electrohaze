import { DataGroup } from './DataGroup';
import type { DocumentField } from '@/types/processing';

interface PostalAddressDataGroupProps {
  fields: Record<string, DocumentField>;
  confidence: number;
  onEdit?: () => void;
}

export function PostalAddressDataGroup({ fields, confidence, onEdit }: PostalAddressDataGroupProps) {
  return (
    <DataGroup
      title="Adres korespondencyjny"
      fields={fields}
      confidence={confidence}
      onEdit={onEdit}
    />
  );
} 