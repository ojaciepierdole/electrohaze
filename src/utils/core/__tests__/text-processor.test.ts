import { TextProcessor } from '../text-processor';

describe('TextProcessor', () => {
  beforeEach(() => {
    TextProcessor.clearCache();
  });

  describe('format', () => {
    it('powinien formatować adresy', () => {
      expect(TextProcessor.format('ul. Kwiatowa 1/2', 'address')).toBe('UL KWIATOWA 1/2');
      expect(TextProcessor.format('ALEJA JANA PAWŁA II 12', 'address')).toBe('ALEJA JANA PAWŁA II 12');
    });

    it('powinien formatować imiona', () => {
      expect(TextProcessor.format('jan', 'name')).toBe('JAN');
      expect(TextProcessor.format('ANNA MARIA', 'name')).toBe('ANNA MARIA');
    });

    it('powinien formatować liczby', () => {
      expect(TextProcessor.format('123.45', 'number')).toBe('123.45');
      expect(TextProcessor.format('1,234.56', 'number')).toBe('1234.56');
    });

    it('powinien formatować tytuły', () => {
      expect(TextProcessor.format('mgr', 'title')).toBe('mgr');
      expect(TextProcessor.format('DR.', 'title')).toBe('dr');
    });
  });

  describe('formatPostalCode', () => {
    it('powinien formatować kody pocztowe', () => {
      expect(TextProcessor.formatPostalCode('12345')).toBe('12-345');
      expect(TextProcessor.formatPostalCode('12-345')).toBe('12-345');
      expect(TextProcessor.formatPostalCode('123456')).toBe('12-345');
    });
  });

  describe('formatBuildingNumber', () => {
    it('powinien formatować numery budynków', () => {
      expect(TextProcessor.formatBuildingNumber('123')).toBe('123');
      expect(TextProcessor.formatBuildingNumber('123A')).toBe('123A');
      expect(TextProcessor.formatBuildingNumber('123/45')).toBe('123/45');
    });
  });

  describe('formatDate', () => {
    it('powinien formatować daty', () => {
      expect(TextProcessor.formatDate('2023-01-02')).toBe('2023-01-02');
      expect(TextProcessor.formatDate('02-01-2023')).toBe('2023-01-02');
      expect(TextProcessor.formatDate('20230102')).toBe('2023-01-02');
    });
  });

  describe('formatAmount', () => {
    it('powinien formatować kwoty', () => {
      expect(TextProcessor.formatAmount('123')).toBe('123,00');
      expect(TextProcessor.formatAmount('123,45')).toBe('123,45');
      expect(TextProcessor.formatAmount('1234.56')).toBe('1234,56');
    });
  });

  describe('normalize', () => {
    it('powinien normalizować tekst', () => {
      expect(TextProcessor.normalize('  test  ')).toBe('test');
      expect(TextProcessor.normalize('TEST', { enforceCase: 'lower' })).toBe('test');
      expect(TextProcessor.normalize('test', { enforceCase: 'upper' })).toBe('TEST');
    });
  });

  describe('cache', () => {
    it('powinien używać cache\'a', () => {
      const text = 'test';
      const result1 = TextProcessor.format(text, 'text');
      const result2 = TextProcessor.format(text, 'text');
      expect(result1).toBe(result2);
      expect(TextProcessor.getCacheSize()).toBe(1);
    });

    it('powinien czyścić cache', () => {
      TextProcessor.format('test', 'text');
      expect(TextProcessor.getCacheSize()).toBe(1);
      TextProcessor.clearCache();
      expect(TextProcessor.getCacheSize()).toBe(0);
    });
  });
}); 