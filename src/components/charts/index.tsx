import * as React from 'react';

interface ChartProps {
  data: any; // TODO: Dodać właściwy typ
  type: 'bar' | 'line' | 'pie';
  options?: any; // TODO: Dodać właściwy typ
}

export const Chart: React.FC<ChartProps> = ({ data, type, options }) => {
  return (
    <div>
      {/* TODO: Implementacja wykresu */}
    </div>
  );
};

export default Chart; 