import {
  formatAmount,
  formatAmountWithCurrency,
  formatAmountWithThousandsSeparator,
  formatAmountFull,
  formatEnergyUsage,
  formatEnergyUsageFull
} from '../amount';

describe('amount formatters', () => {
  describe('formatAmount', () => {
    it('powinien formatować kwotę z dwoma miejscami po przecinku', () => {
      expect(formatAmount('123.45')).toBe('123,45');
      expect(formatAmount('123,45')).toBe('123,45');
    });

    it('powinien uzupełniać brakujące miejsca po przecinku', () => {
      expect(formatAmount('123')).toBe('123,00');
      expect(formatAmount('123.')).toBe('123,00');
      expect(formatAmount('123,5')).toBe('123,50');
    });

    it('powinien przycinać nadmiarowe miejsca po przecinku', () => {
      expect(formatAmount('123.456')).toBe('123,45');
      expect(formatAmount('123,456')).toBe('123,45');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatAmount(null)).toBe('');
    });
  });

  describe('formatAmountWithCurrency', () => {
    it('powinien formatować kwotę z walutą', () => {
      expect(formatAmountWithCurrency('123.45')).toBe('123,45 PLN');
      expect(formatAmountWithCurrency('123.45', 'EUR')).toBe('123,45 EUR');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatAmountWithCurrency(null)).toBe('');
    });
  });

  describe('formatAmountWithThousandsSeparator', () => {
    it('powinien formatować kwotę z separatorem tysięcy', () => {
      expect(formatAmountWithThousandsSeparator('1234567.89'))
        .toBe('1 234 567,89');
    });

    it('powinien obsługiwać małe kwoty', () => {
      expect(formatAmountWithThousandsSeparator('123.45'))
        .toBe('123,45');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatAmountWithThousandsSeparator(null)).toBe('');
    });
  });

  describe('formatAmountFull', () => {
    it('powinien formatować kwotę z separatorem tysięcy i walutą', () => {
      expect(formatAmountFull('1234567.89'))
        .toBe('1 234 567,89 PLN');
      expect(formatAmountFull('1234567.89', 'EUR'))
        .toBe('1 234 567,89 EUR');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatAmountFull(null)).toBe('');
    });
  });

  describe('formatEnergyUsage', () => {
    it('powinien formatować zużycie energii', () => {
      expect(formatEnergyUsage('123.45')).toBe('123,45 kWh');
      expect(formatEnergyUsage('123.45', 'MWh')).toBe('123,45 MWh');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatEnergyUsage(null)).toBe('');
    });
  });

  describe('formatEnergyUsageFull', () => {
    it('powinien formatować zużycie energii z separatorem tysięcy', () => {
      expect(formatEnergyUsageFull('1234567.89'))
        .toBe('1 234 567,89 kWh');
      expect(formatEnergyUsageFull('1234567.89', 'MWh'))
        .toBe('1 234 567,89 MWh');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatEnergyUsageFull(null)).toBe('');
    });
  });
}); 