import { formatPostalCode, formatCity, normalizeAddressNumbers, formatStreet } from '../address';

describe('address formatters', () => {
  describe('formatPostalCode', () => {
    it('powinien formatować poprawny kod pocztowy', () => {
      expect(formatPostalCode('12345')).toBe('12-345');
    });

    it('powinien obsługiwać kod pocztowy z myślnikiem', () => {
      expect(formatPostalCode('12-345')).toBe('12-345');
    });

    it('powinien obsługiwać kod pocztowy ze spacjami', () => {
      expect(formatPostalCode('12 345')).toBe('12-345');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatPostalCode(null)).toBe('');
    });
  });

  describe('formatCity', () => {
    it('powinien formatować nazwę miasta', () => {
      expect(formatCity('warszawa')).toBe('WARSZAWA');
    });

    it('powinien obsługiwać polskie znaki', () => {
      expect(formatCity('łódź')).toBe('LODZ');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatCity(null)).toBe('');
    });
  });

  describe('normalizeAddressNumbers', () => {
    it('powinien obsługiwać prosty numer', () => {
      expect(normalizeAddressNumbers('123')).toEqual({
        building: '123',
        unit: null
      });
    });

    it('powinien obsługiwać numer z literą', () => {
      expect(normalizeAddressNumbers('123A')).toEqual({
        building: '123A',
        unit: null
      });
    });

    it('powinien obsługiwać numer z mieszkaniem', () => {
      expect(normalizeAddressNumbers('123/45')).toEqual({
        building: '123',
        unit: '45'
      });
    });

    it('powinien obsługiwać numer z literą i mieszkaniem', () => {
      expect(normalizeAddressNumbers('123A/45B')).toEqual({
        building: '123A',
        unit: '45B'
      });
    });

    it('powinien obsługiwać numer z oznaczeniem mieszkania', () => {
      expect(normalizeAddressNumbers('123 m. 45')).toEqual({
        building: '123',
        unit: '45'
      });
    });

    it('powinien zwracać null dla null', () => {
      expect(normalizeAddressNumbers(null)).toEqual({
        building: null,
        unit: null
      });
    });
  });

  describe('formatStreet', () => {
    it('powinien formatować nazwę ulicy', () => {
      expect(formatStreet('ul. kwiatowa')).toBe('UL. KWIATOWA');
    });

    it('powinien normalizować prefiks ulicy', () => {
      expect(formatStreet('ulica kwiatowa')).toBe('UL. KWIATOWA');
      expect(formatStreet('aleja niepodległości')).toBe('AL. NIEPODLEGLOSCI');
      expect(formatStreet('plac wolności')).toBe('PL. WOLNOSCI');
      expect(formatStreet('osiedle słoneczne')).toBe('OS. SLONECZNE');
    });

    it('powinien obsługiwać polskie znaki', () => {
      expect(formatStreet('ul. łąkowa')).toBe('UL. LAKOWA');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatStreet(null)).toBe('');
    });
  });
}); 