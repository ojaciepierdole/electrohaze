import { normalizeText } from '../core/text';
import { removeSpecialCharacters } from '@/utils/text-processing/core/normalization';

// Formatuje tekst do postaci tytułowej (pierwsza litera każdego słowa wielka)
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Formatuje tekst do wielkich liter
export function toUpperCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.toUpperCase();
}

// Formatuje tekst do małych liter
export function toLowerCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase();
}

// Usuwa nadmiarowe białe znaki
export function removeExtraWhitespace(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

// Formatuje tekst do postaci standardowej (usuwa nadmiarowe białe znaki i znaki specjalne)
export function standardizeText(text: string | null | undefined): string {
  if (!text) return '';
  const cleaned = removeSpecialCharacters(text) || '';
  return removeExtraWhitespace(cleaned);
}

// Usuwa polskie znaki diakrytyczne
export function removeDiacritics(text: string | null | undefined): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
  