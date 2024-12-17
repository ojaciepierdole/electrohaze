import { 
  formatFirstName,
  formatLastName,
  formatBusinessName,
  formatTaxId,
  formatRegon,
  formatPesel,
  formatPhoneNumber,
  formatEmail,
  formatBankAccount,
  formatTitle
} from '../person';

describe('person formatters', () => {
  describe('formatFirstName', () => {
    it('powinien formatować imię', () => {
      expect(formatFirstName('jan')).toBe('JAN');
    });

    it('powinien obsługiwać polskie znaki', () => {
      expect(formatFirstName('łukasz')).toBe('LUKASZ');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatFirstName(null)).toBe('');
    });
  });

  describe('formatLastName', () => {
    it('powinien formatować nazwisko', () => {
      expect(formatLastName('kowalski')).toBe('KOWALSKI');
    });

    it('powinien obsługiwać polskie znaki', () => {
      expect(formatLastName('wąsik')).toBe('WASIK');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatLastName(null)).toBe('');
    });
  });

  describe('formatBusinessName', () => {
    it('powinien formatować nazwę firmy', () => {
      expect(formatBusinessName('test sp. z o.o.')).toBe('TEST SP. Z O.O.');
    });

    it('powinien obsługiwać polskie znaki', () => {
      expect(formatBusinessName('łąka sp.j.')).toBe('LAKA SP.J.');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatBusinessName(null)).toBe('');
    });
  });

  describe('formatTaxId', () => {
    it('powinien formatować NIP', () => {
      expect(formatTaxId('1234567890')).toBe('123-456-78-90');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(formatTaxId('123-456-78-90')).toBe('123-456-78-90');
    });

    it('powinien zachowywać niepełny NIP bez formatowania', () => {
      expect(formatTaxId('123456')).toBe('123456');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatTaxId(null)).toBe('');
    });
  });

  describe('formatRegon', () => {
    it('powinien formatować REGON 9-cyfrowy', () => {
      expect(formatRegon('123456789')).toBe('123-456-789');
    });

    it('powinien formatować REGON 14-cyfrowy', () => {
      expect(formatRegon('12345678901234')).toBe('123-456-78-90123');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(formatRegon('123-456-789')).toBe('123-456-789');
    });

    it('powinien zachowywać niepełny REGON bez formatowania', () => {
      expect(formatRegon('123456')).toBe('123456');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatRegon(null)).toBe('');
    });
  });

  describe('formatPesel', () => {
    it('powinien formatować PESEL', () => {
      expect(formatPesel('12345678901')).toBe('12345678901');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(formatPesel('123-456-789-01')).toBe('12345678901');
    });

    it('powinien zachowywać niepełny PESEL bez formatowania', () => {
      expect(formatPesel('123456')).toBe('123456');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatPesel(null)).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('powinien formatować numer telefonu', () => {
      expect(formatPhoneNumber('123456789')).toBe('123-456-789');
    });

    it('powinien usuwać prefiks kraju', () => {
      expect(formatPhoneNumber('+48123456789')).toBe('123-456-789');
      expect(formatPhoneNumber('48123456789')).toBe('123-456-789');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(formatPhoneNumber('123-456-789')).toBe('123-456-789');
    });

    it('powinien zachowywać niepełny numer bez formatowania', () => {
      expect(formatPhoneNumber('123456')).toBe('123456');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatPhoneNumber(null)).toBe('');
    });
  });

  describe('formatEmail', () => {
    it('powinien formatować email', () => {
      expect(formatEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('powinien usuwać białe znaki', () => {
      expect(formatEmail(' test@example.com ')).toBe('test@example.com');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatEmail(null)).toBe('');
    });
  });

  describe('formatBankAccount', () => {
    it('powinien formatować numer konta', () => {
      expect(formatBankAccount('12345678901234567890123456'))
        .toBe('12 3456 7890 1234 5678 9012 3456');
    });

    it('powinien usuwać znaki specjalne', () => {
      expect(formatBankAccount('12 3456 7890 1234 5678 9012 3456'))
        .toBe('12 3456 7890 1234 5678 9012 3456');
    });

    it('powinien zachowywać niepełny numer bez formatowania', () => {
      expect(formatBankAccount('123456')).toBe('123456');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatBankAccount(null)).toBe('');
    });
  });

  describe('formatTitle', () => {
    it('powinien formatować tytuł', () => {
      expect(formatTitle('pan')).toBe('Pan');
      expect(formatTitle('pani')).toBe('Pani');
    });

    it('powinien formatować tytuł naukowy', () => {
      expect(formatTitle('mgr')).toBe('mgr');
      expect(formatTitle('mgr.')).toBe('mgr');
      expect(formatTitle('dr')).toBe('dr');
      expect(formatTitle('dr.')).toBe('dr');
      expect(formatTitle('prof')).toBe('prof.');
      expect(formatTitle('prof.')).toBe('prof.');
    });

    it('powinien formatować tytuł zawodowy', () => {
      expect(formatTitle('inz')).toBe('inż.');
      expect(formatTitle('inz.')).toBe('inż.');
    });

    it('powinien zachowywać nieznany tytuł', () => {
      expect(formatTitle('test')).toBe('TEST');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatTitle(null)).toBe('');
    });
  });
}); 