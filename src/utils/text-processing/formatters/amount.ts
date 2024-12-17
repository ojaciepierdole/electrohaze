import { TextProcessor } from '../../core/text-processor';

/**
 * Formatuje kwotę do formatu z dwoma miejscami po przecinku
 */
export function formatAmount(amount: string | null): string {
  return TextProcessor.formatAmount(amount);
}

/**
 * Formatuje kwotę do formatu z dwoma miejscami po przecinku i symbolem waluty
 */
export function formatAmountWithCurrency(amount: string | null, currency: string = 'PLN'): string {
  const formattedAmount = formatAmount(amount);
  if (!formattedAmount) return '';
  
  return `${formattedAmount} ${currency}`;
}

/**
 * Formatuje kwotę do formatu z separatorem tysięcy
 */
export function formatAmountWithThousandsSeparator(amount: string | null): string {
  const formattedAmount = formatAmount(amount);
  if (!formattedAmount) return '';
  
  const [integerPart, decimalPart = '00'] = formattedAmount.split(',');
  
  // Dodaj separator tysięcy
  const withSeparator = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${withSeparator},${decimalPart}`;
}

/**
 * Formatuje kwotę do formatu z separatorem tysięcy i symbolem waluty
 */
export function formatAmountFull(amount: string | null, currency: string = 'PLN'): string {
  const formattedAmount = formatAmountWithThousandsSeparator(amount);
  if (!formattedAmount) return '';
  
  return `${formattedAmount} ${currency}`;
}

/**
 * Formatuje zużycie energii do formatu z dwoma miejscami po przecinku i jednostką
 */
export function formatEnergyUsage(usage: string | null, unit: string = 'kWh'): string {
  const formattedAmount = formatAmount(usage);
  if (!formattedAmount) return '';
  
  return `${formattedAmount} ${unit}`;
}

/**
 * Formatuje zużycie energii do formatu z separatorem tysięcy i jednostką
 */
export function formatEnergyUsageFull(usage: string | null, unit: string = 'kWh'): string {
  const formattedAmount = formatAmountWithThousandsSeparator(usage);
  if (!formattedAmount) return '';
  
  return `${formattedAmount} ${unit}`;
} 