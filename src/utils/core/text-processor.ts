/**
 * Typy operacji formatowania
 */
type FormatType = 
  | 'text'
  | 'name'
  | 'address'
  | 'number'
  | 'title'
  | 'date'
  | 'amount'
  | 'postal_code'
  | 'phone'
  | 'email'
  | 'tax_id'
  | 'bank_account';

/**
 * Typy operacji cache'owania
 */
type CacheType = FormatType | 'clean' | 'building_number' | 'date_format' | 'amount_format';

/**
 * Klucz cache'a
 */
interface CacheKey {
  text: string;
  type?: CacheType;
  options?: TextNormalizationOptions;
}

/**
 * Opcje normalizacji tekstu
 */
export interface TextNormalizationOptions {
  /** Czy normalizować polskie znaki */
  normalizePolish?: boolean;
  /** Czy usuwać znaki specjalne */
  removeSpecialChars?: boolean;
  /** Czy normalizować białe znaki */
  trimWhitespace?: boolean;
  /** Wymuszenie wielkości liter */
  enforceCase?: 'upper' | 'lower' | 'none';
}

/**
 * Centralna klasa do przetwarzania tekstu w aplikacji
 */
export class TextProcessor {
  // Cache dla przetworzonych tekstów
  private static cache = new Map<string, string>();
  private static readonly MAX_CACHE_SIZE = 1000;

  // Słownik tytułów
  private static readonly titles: Record<string, string> = {
    'PAN': 'Pan',
    'PANI': 'Pani',
    'MGR': 'mgr',
    'MGR.': 'mgr',
    'INZ': 'inż.',
    'INZ.': 'inż.',
    'DR': 'dr',
    'DR.': 'dr',
    'PROF': 'prof.',
    'PROF.': 'prof.'
  };

  /**
   * Generuje klucz cache'a
   */
  private static getCacheKey(key: CacheKey): string {
    return JSON.stringify({
      text: key.text,
      type: key.type || null,
      options: key.options || null
    });
  }

  /**
   * Pobiera wartość z cache'a
   */
  private static getFromCache(key: CacheKey): string | undefined {
    return this.cache.get(this.getCacheKey(key));
  }

  /**
   * Zapisuje wartość w cache'u
   */
  private static setInCache(key: CacheKey, value: string): void {
    // Jeśli cache jest pełny, usuń najstarsze wpisy
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.1));
      keysToDelete.forEach(key => this.cache.delete(key));
    }

    this.cache.set(this.getCacheKey(key), value);
  }

  /**
   * Czyści cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Zwraca rozmiar cache'a
   */
  static getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Podstawowa funkcja przetwarzająca tekst
   */
  private static processText(text: string | null, type: CacheType, options: TextNormalizationOptions = {}): string {
    if (!text) return '';

    // Sprawdź cache
    const cacheKey: CacheKey = { text, type, options };
    const cached = this.getFromCache(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    let result = text;

    // Usuwanie znaków specjalnych
    if (options.removeSpecialChars) {
      result = result.replace(/[^\p{L}\p{N}\s.-]/gu, '');
    }

    // Normalizacja białych znaków
    if (options.trimWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    // Normalizacja polskich znaków
    if (options.normalizePolish) {
      result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Wymuszenie wielkości liter
    if (options.enforceCase === 'upper') {
      result = result.toUpperCase();
    } else if (options.enforceCase === 'lower') {
      result = result.toLowerCase();
    }

    // Zapisz w cache'u
    this.setInCache(cacheKey, result);

    return result;
  }

  /**
   * Normalizuje tekst według podanych opcji
   */
  static normalize(text: string | null, options: TextNormalizationOptions = {}): string {
    return this.processText(text, 'clean', options);
  }

  /**
   * Formatuje tekst według typu
   */
  static format(text: string | null, type: FormatType): string {
    const baseOptions: TextNormalizationOptions = {
      removeSpecialChars: true,
      trimWhitespace: true
    };

    switch (type) {
      case 'address':
      case 'name':
        return this.processText(text, type, {
          ...baseOptions,
          enforceCase: 'upper',
          normalizePolish: true
        });

      case 'number':
        return this.processText(text, type, baseOptions)
          .replace(/[^\d.-]/g, '');

      case 'title': {
        const cleaned = this.processText(text, type, {
          ...baseOptions,
          enforceCase: 'upper'
        });
        return this.titles[cleaned] || cleaned;
      }

      case 'date':
        return this.processText(text, type, baseOptions)
          .replace(/[^\d.-]/g, '');

      case 'amount':
        return this.processText(text, type, baseOptions)
          .replace(/[^\d.,]/g, '');

      default:
        return this.processText(text, 'clean', baseOptions);
    }
  }

  /**
   * Formatuje kod pocztowy
   */
  static formatPostalCode(text: string | null): string {
    const cleaned = this.format(text, 'number');
    
    if (cleaned.length === 5) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
    
    if (cleaned.length > 5) {
      const truncated = cleaned.slice(0, 5);
      return `${truncated.slice(0, 2)}-${truncated.slice(2)}`;
    }
    
    return cleaned;
  }

  /**
   * Formatuje numer budynku/lokalu
   */
  static formatBuildingNumber(text: string | null): string {
    return this.format(text, 'number');
  }

  /**
   * Formatuje datę do formatu YYYY-MM-DD
   */
  static formatDate(text: string | null): string {
    const cleaned = this.format(text, 'date');

    // Sprawdź różne formaty daty
    const patterns = [
      // YYYY-MM-DD
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // DD-MM-YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/,
      // YYYYMMDD
      /^(\d{4})(\d{2})(\d{2})$/,
      // DDMMYYYY
      /^(\d{2})(\d{2})(\d{4})$/
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const [_, part1, part2, part3] = match;
        
        // Jeśli format to YYYY-MM-DD lub YYYYMMDD
        if (part1.length === 4) {
          return `${part1}-${part2}-${part3}`;
        }
        
        // Jeśli format to DD-MM-YYYY lub DDMMYYYY
        return `${part3}-${part2}-${part1}`;
      }
    }

    return cleaned;
  }

  /**
   * Formatuje kwotę do formatu z dwoma miejscami po przecinku
   */
  static formatAmount(text: string | null): string {
    const cleaned = this.format(text, 'amount');
    const normalized = cleaned.replace(/\./g, ',');
    const parts = normalized.split(',');
    
    if (parts.length === 1) {
      return `${parts[0]},00`;
    }

    const integerPart = parts.slice(0, -1).join('');
    let decimalPart = parts[parts.length - 1];

    if (decimalPart.length === 0) {
      decimalPart = '00';
    } else if (decimalPart.length === 1) {
      decimalPart += '0';
    } else if (decimalPart.length > 2) {
      decimalPart = decimalPart.slice(0, 2);
    }

    return `${integerPart},${decimalPart}`;
  }
} 