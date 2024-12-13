import type { ISODateString } from '@/types/common';

export function parseDate(value: string | Date): ISODateString | undefined {
  if (!value) return undefined;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString() as ISODateString;
  } catch {
    return undefined;
  }
} 