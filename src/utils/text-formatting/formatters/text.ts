import { normalizeText } from '../core/text';

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

// Usuwa znaki specjalne z tekstu
export function removeSpecialChars(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9\s]/g, '');
}

// Usuwa polskie znaki diakrytyczne
export function removeDiacritics(text: string | null | undefined): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Usuwa nadmiarowe białe znaki
export function removeExtraWhitespace(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

// Formatuje tekst do postaci standardowej (usuwa nadmiarowe białe znaki i znaki specjalne)
export function standardizeText(text: string | null | undefined): string {
  if (!text) return '';
  return removeSpecialChars(removeExtraWhitespace(text));
} 