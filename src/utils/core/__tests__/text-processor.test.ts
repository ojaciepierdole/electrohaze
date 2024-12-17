import { TextProcessor } from '../text-processor';

describe('TextProcessor', () => {
  beforeEach(() => {
    TextProcessor.clearCache();
  });

  describe('cache', () => {
    it('powinien cachować wyniki normalizacji', () => {
      const text = 'test   test@#$%^&*()';
      const options = { removeSpecialChars: true, trimWhitespace: true };

      // Pierwsze wywołanie
      const result1 = TextProcessor.normalize(text, options);
      expect(TextProcessor.getCacheSize()).toBe(1);

      // Drugie wywołanie (powinno użyć cache'a)
      const result2 = TextProcessor.normalize(text, options);
      expect(TextProcessor.getCacheSize()).toBe(1);
      expect(result2).toBe(result1);
    });

    it('powinien cachować wyniki formatowania', () => {
      const text = '  test@example.com  ';

      // Pierwsze wywołanie
      const result1 = TextProcessor.format(text, 'name');
      expect(TextProcessor.getCacheSize()).toBe(1);

      // Drugie wywołanie (powinno użyć cache'a)
      const result2 = TextProcessor.format(text, 'name');
      expect(TextProcessor.getCacheSize()).toBe(1);
      expect(result2).toBe(result1);
    });

    it('powinien cachować wyniki formatowania kodu pocztowego', () => {
      const text = '12345';

      // Pierwsze wywołanie
      const result1 = TextProcessor.formatPostalCode(text);
      expect(TextProcessor.getCacheSize()).toBe(2); // format + formatPostalCode

      // Drugie wywołanie (powinno użyć cache'a)
      const result2 = TextProcessor.formatPostalCode(text);
      expect(TextProcessor.getCacheSize()).toBe(2);
      expect(result2).toBe(result1);
    });

    it('powinien cachować wyniki formatowania daty', () => {
      const text = '2023-12-31';

      // Pierwsze wywołanie
      const result1 = TextProcessor.formatDate(text);
      expect(TextProcessor.getCacheSize()).toBe(2); // format + formatDate

      // Drugie wywołanie (powinno użyć cache'a)
      const result2 = TextProcessor.formatDate(text);
      expect(TextProcessor.getCacheSize()).toBe(2);
      expect(result2).toBe(result1);
    });

    it('powinien cachować wyniki formatowania kwoty', () => {
      const text = '1234.56';

      // Pierwsze wywołanie
      const result1 = TextProcessor.formatAmount(text);
      expect(TextProcessor.getCacheSize()).toBe(2); // format + formatAmount

      // Drugie wywołanie (powinno użyć cache'a)
      const result2 = TextProcessor.formatAmount(text);
      expect(TextProcessor.getCacheSize()).toBe(2);
      expect(result2).toBe(result1);
    });

    it('powinien ograniczać rozmiar cache\'a', () => {
      // Wypełnij cache maksymalną liczbą wpisów
      for (let i = 0; i < 1000; i++) {
        TextProcessor.normalize(`test${i}`, { trimWhitespace: true });
      }
      expect(TextProcessor.getCacheSize()).toBe(1000);

      // Dodaj kolejny wpis
      TextProcessor.normalize('test1000', { trimWhitespace: true });
      
      // Cache powinien być mniejszy o 10%
      expect(TextProcessor.getCacheSize()).toBeLessThan(1000);
    });

    it('powinien czyścić cache', () => {
      // Dodaj kilka wpisów do cache'a
      TextProcessor.normalize('test1', { trimWhitespace: true });
      TextProcessor.normalize('test2', { trimWhitespace: true });
      TextProcessor.normalize('test3', { trimWhitespace: true });
      expect(TextProcessor.getCacheSize()).toBe(3);

      // Wyczyść cache
      TextProcessor.clearCache();
      expect(TextProcessor.getCacheSize()).toBe(0);
    });
  });

  describe('normalize', () => {
    it('powinien zwrócić pusty string dla null', () => {
      expect(TextProcessor.normalize(null)).toBe('');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(TextProcessor.normalize('test@#$%^&*()', { removeSpecialChars: true }))
        .toBe('test');
    });

    it('powinien normalizować białe znaki', () => {
      expect(TextProcessor.normalize('test   test\n\t  test', { trimWhitespace: true }))
        .toBe('test test test');
    });

    it('powinien normalizować polskie znaki', () => {
      expect(TextProcessor.normalize('ąćęłńóśźż', { normalizePolish: true }))
        .toBe('acelnoszz');
    });

    it('powinien wymuszać wielkość liter', () => {
      expect(TextProcessor.normalize('Test', { enforceCase: 'upper' }))
        .toBe('TEST');
      expect(TextProcessor.normalize('Test', { enforceCase: 'lower' }))
        .toBe('test');
    });
  });

  describe('clean', () => {
    it('powinien czyścić tekst', () => {
      expect(TextProcessor.clean('  test@#$%^&*()  test  ')).toBe('test test');
    });
  });

  describe('format', () => {
    describe('address', () => {
      it('powinien formatować adres', () => {
        expect(TextProcessor.format('ul. Kwiatowa 1/2', 'address'))
          .toBe('UL. KWIATOWA 1/2');
      });
    });

    describe('name', () => {
      it('powinien formatować imię i nazwisko', () => {
        expect(TextProcessor.format('Jan Kowalski', 'name'))
          .toBe('JAN KOWALSKI');
      });
    });

    describe('number', () => {
      it('powinien formatować numer', () => {
        expect(TextProcessor.format('123-456', 'number'))
          .toBe('123-456');
      });
    });
  });

  describe('formatPostalCode', () => {
    it('powinien formatować kod pocztowy', () => {
      expect(TextProcessor.formatPostalCode('12345')).toBe('12-345');
      expect(TextProcessor.formatPostalCode('123456')).toBe('12-345');
      expect(TextProcessor.formatPostalCode('1234')).toBe('1234');
    });
  });

  describe('formatBuildingNumber', () => {
    it('powinien formatować numer budynku', () => {
      expect(TextProcessor.formatBuildingNumber('123A')).toBe('123A');
      expect(TextProcessor.formatBuildingNumber('123 a')).toBe('123A');
      expect(TextProcessor.formatBuildingNumber('123/4')).toBe('123/4');
    });
  });
}); 