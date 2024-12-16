import type { ColumnField, ColumnLayout } from './types';

const GRID_CLASSES = ['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4'] as const;
type GridClass = typeof GRID_CLASSES[number];

export function calculateOptimalColumns(fields: ColumnField[]): ColumnLayout {
  const totalFields = fields.length;
  const numColumns = 4;
  
  // Oblicz ile pól powinno być w każdej kolumnie
  const fieldsPerColumn = Math.ceil(totalFields / numColumns);

  // Podziel pola na kolumny
  const columns = Array.from({ length: numColumns }, (_, columnIndex) => {
    const start = columnIndex * fieldsPerColumn;
    const end = Math.min(start + fieldsPerColumn, totalFields);
    return fields.slice(start, end);
  }).filter(column => column.length > 0); // Usuń puste kolumny

  // Używamy konkretnego typu dla gridClass
  const gridClass: GridClass[] = [
    'grid-cols-1',
    'sm:grid-cols-2',
    'lg:grid-cols-3',
    'xl:grid-cols-4'
  ];

  return { 
    columns, 
    gridClass: gridClass.join(' ') 
  };
} 