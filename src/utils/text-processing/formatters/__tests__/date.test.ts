import {
  formatDate,
  formatDisplayDate,
  formatDateRange,
  formatDateTime,
  formatDisplayDateTime
} from '../date';

describe('date formatters', () => {
  describe('formatDate', () => {
    it('powinien formatować datę w formacie YYYY-MM-DD', () => {
      expect(formatDate('2023-12-31')).toBe('2023-12-31');
    });

    it('powinien formatować datę w formacie DD-MM-YYYY', () => {
      expect(formatDate('31-12-2023')).toBe('2023-12-31');
    });

    it('powinien formatować datę bez separatorów', () => {
      expect(formatDate('20231231')).toBe('2023-12-31');
      expect(formatDate('31122023')).toBe('2023-12-31');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('formatDisplayDate', () => {
    it('powinien formatować datę w formacie DD.MM.YYYY', () => {
      expect(formatDisplayDate('2023-12-31')).toBe('31.12.2023');
    });

    it('powinien obsługiwać różne formaty wejściowe', () => {
      expect(formatDisplayDate('31-12-2023')).toBe('31.12.2023');
      expect(formatDisplayDate('20231231')).toBe('31.12.2023');
      expect(formatDisplayDate('31122023')).toBe('31.12.2023');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatDisplayDate(null)).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('powinien formatować zakres dat', () => {
      expect(formatDateRange('2023-01-01', '2023-12-31'))
        .toBe('01.01.2023 - 31.12.2023');
    });

    it('powinien obsługiwać brak daty początkowej', () => {
      expect(formatDateRange(null, '2023-12-31'))
        .toBe('31.12.2023');
    });

    it('powinien obsługiwać brak daty końcowej', () => {
      expect(formatDateRange('2023-01-01', null))
        .toBe('01.01.2023');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatDateRange(null, null)).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('powinien formatować datę i czas w formacie YYYY-MM-DD HH:mm:ss', () => {
      expect(formatDateTime('2023-12-31 15:30:45'))
        .toBe('2023-12-31 15:30:45');
    });

    it('powinien formatować datę i czas bez sekund', () => {
      expect(formatDateTime('2023-12-31 15:30'))
        .toBe('2023-12-31 15:30:00');
    });

    it('powinien obsługiwać różne formaty wejściowe', () => {
      expect(formatDateTime('31-12-2023 15:30:45'))
        .toBe('2023-12-31 15:30:45');
      expect(formatDateTime('31-12-2023 15:30'))
        .toBe('2023-12-31 15:30:00');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('formatDisplayDateTime', () => {
    it('powinien formatować datę i czas w formacie DD.MM.YYYY HH:mm', () => {
      expect(formatDisplayDateTime('2023-12-31 15:30:45'))
        .toBe('31.12.2023 15:30');
    });

    it('powinien obsługiwać różne formaty wejściowe', () => {
      expect(formatDisplayDateTime('31-12-2023 15:30:45'))
        .toBe('31.12.2023 15:30');
      expect(formatDisplayDateTime('31-12-2023 15:30'))
        .toBe('31.12.2023 15:30');
    });

    it('powinien zwracać pusty string dla null', () => {
      expect(formatDisplayDateTime(null)).toBe('');
    });
  });
}); 