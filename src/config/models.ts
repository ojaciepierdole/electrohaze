import type { ModelDefinition, FieldType } from '@/types/processing';
import { FIELD_GROUPS } from './fields';

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: 'prebuilt-document',
    name: 'Prebuilt Document',
    description: 'Model wstępnie wytrenowany do analizy dokumentów',
    version: '2023-07-31',
    fields: Object.values(FIELD_GROUPS).flatMap(group => 
      group.fields.map(fieldName => ({
        name: fieldName,
        type: 'string' as FieldType,
        isRequired: group.requiredFields.includes(fieldName),
        description: '',
        group: group.name
      }))
    ),
    isCustom: false,
    status: 'ready'
  },
  {
    id: 'prebuilt-layout',
    name: 'Prebuilt Layout',
    description: 'Model wstępnie wytrenowany do analizy układu dokumentu',
    version: '2023-07-31',
    fields: Object.values(FIELD_GROUPS).flatMap(group => 
      group.fields.map(fieldName => ({
        name: fieldName,
        type: 'string' as FieldType,
        isRequired: group.requiredFields.includes(fieldName),
        description: '',
        group: group.name
      }))
    ),
    isCustom: false,
    status: 'ready'
  }
];

// Funkcja pomocnicza do sprawdzania czy model jest niestandardowy
export const isCustomModel = (modelId: string): boolean => {
  return !modelId.startsWith('prebuilt-');
}; 