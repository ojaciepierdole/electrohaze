import { FC, ReactNode } from 'react';

declare module 'recharts' {
  export interface ResponsiveContainerProps {
    children?: ReactNode;
    width?: string | number;
    height?: string | number;
  }

  export interface BarProps {
    dataKey: string;
    fill?: string;
    radius?: number | [number, number, number, number];
  }

  export const ResponsiveContainer: FC<ResponsiveContainerProps>;
  export const Bar: FC<BarProps>;
} 