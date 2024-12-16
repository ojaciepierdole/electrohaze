// Reeksport wszystkich funkcji z nowej struktury modułów
export * from './text-formatting/types';
export * from './text-formatting/person';
export * from './text-formatting/address';
export * from './text-formatting/numbers';
export * from './text-formatting/supplier';
export * from './text-formatting/billing';
export * from './text-formatting/index';
export * from './text-formatting/core/normalization';

// Reeksportujemy konkretne funkcje formatujące z numbers.ts
export {
  formatDate,
  formatConsumption,
  formatAmount,
  formatPercentage,
  formatInteger,
  formatDecimal
} from './text-formatting/numbers';
