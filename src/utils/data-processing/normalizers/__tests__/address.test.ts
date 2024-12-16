import { 
  normalizeStreet,
  normalizeAddressNumbers,
  splitAddressLine,
  getEmptyAddressComponents
} from '../address';

describe('normalizeStreet', () => {
  test('powinien obsługiwać null', () => {
    expect(normalizeStreet(null)).toBeNull();
  });

  test('powinien usuwać "ULICA" i jej skróty', () => {
    const cases = [
      ['ul. Marszałkowska', 'MARSZAŁKOWSKA'],
      ['UL Złota', 'ZŁOTA'],
      ['Ulica Piękna', 'PIĘKNA'],
      ['ULICA Marszałkowska', 'MARSZAŁKOWSKA'],
      ['ul.Mickiewicza', 'MICKIEWICZA'],
      ['UL.Słowackiego', 'SŁOWACKIEGO']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien zachowywać "ALEJA" i jej skróty', () => {
    const cases = [
      ['Aleja Niepodległości', 'ALEJA NIEPODLEGŁOŚCI'],
      ['ALEJA Róż', 'ALEJA RÓŻ'],
      ['al. Jerozolimskie', 'ALEJA JEROZOLIMSKIE'],
      ['AL. Jana Pawła II', 'ALEJA JANA PAWŁA II'],
      ['al.Wojska Polskiego', 'ALEJA WOJSKA POLSKIEGO'],
      ['AL Ujazdowskie', 'ALEJA UJAZDOWSKIE']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien zachowywać "PLAC" i jego skróty', () => {
    const cases = [
      ['Plac Zbawiciela', 'PLAC ZBAWICIELA'],
      ['PLAC Konstytucji', 'PLAC KONSTYTUCJI'],
      ['pl. Bankowy', 'PLAC BANKOWY'],
      ['PL. Konstytucji', 'PLAC KONSTYTUCJI'],
      ['pl.Wolności', 'PLAC WOLNOŚCI'],
      ['PL Zamkowy', 'PLAC ZAMKOWY']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien zachowywać "OSIEDLE" i usuwać jego skróty', () => {
    const cases = [
      ['Osiedle Tysiąclecia', 'OSIEDLE TYSIĄCLECIA'],
      ['OSIEDLE Batorego', 'OSIEDLE BATOREGO'],
      ['os. Tysiąclecia', 'TYSIĄCLECIA'],
      ['OS. Batorego', 'BATOREGO'],
      ['os.Słoneczne', 'SŁONECZNE']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien zachowywać "RONDO"', () => {
    const cases = [
      ['Rondo Daszyńskiego', 'RONDO DASZYŃSKIEGO'],
      ['RONDO ONZ', 'RONDO ONZ'],
      ['Rondo Radosława', 'RONDO RADOSŁAWA']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien zachowywać spacje w nazwach wieloczłonowych', () => {
    const cases = [
      ['ul. Jana Pawła II', 'JANA PAWŁA II'],
      ['Aleja Armii Krajowej', 'ALEJA ARMII KRAJOWEJ'],
      ['al. Armii Krajowej', 'ALEJA ARMII KRAJOWEJ'],
      ['Plac Jana Pawła II', 'PLAC JANA PAWŁA II'],
      ['pl. Jana Pawła II', 'PLAC JANA PAWŁA II'],
      ['Osiedle Pod Lipami', 'OSIEDLE POD LIPAMI'],
      ['Rondo Zesłańców Syberyjskich', 'RONDO ZESŁAŃCÓW SYBERYJSKICH']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien usuwać kropki i przecinki na końcu', () => {
    const cases = [
      ['ul. Marszałkowska.', 'MARSZAŁKOWSKA'],
      ['Aleja Niepodległości,', 'ALEJA NIEPODLEGŁOŚCI'],
      ['al. Niepodległości,', 'ALEJA NIEPODLEGŁOŚCI'],
      ['Plac Zbawiciela.', 'PLAC ZBAWICIELA'],
      ['pl. Zbawiciela.', 'PLAC ZBAWICIELA'],
      ['Osiedle Tysiąclecia.', 'OSIEDLE TYSIĄCLECIA'],
      ['Rondo ONZ,', 'RONDO ONZ']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });

  test('powinien obsługiwać nazwy bez prefiksów', () => {
    const cases = [
      ['Marszałkowska', 'MARSZAŁKOWSKA'],
      ['Złota', 'ZŁOTA'],
      ['Jana Pawła II', 'JANA PAWŁA II'],
      ['Armii Krajowej', 'ARMII KRAJOWEJ']
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeStreet(input)).toBe(expected);
    });
  });
});

describe('normalizeAddressNumbers', () => {
  test('powinien obsługiwać null', () => {
    expect(normalizeAddressNumbers(null)).toEqual({ building: null, unit: null });
  });

  test('powinien obsługiwać podstawowe formaty numerów', () => {
    const cases: [string, { building: string | null; unit: string | null }][] = [
      // Format z ukośnikiem
      ['4C/29', { building: '4C', unit: '29' }],
      ['12/34', { building: '12', unit: '34' }],
      
      // Format z literą
      ['4C', { building: '4C', unit: null }],
      ['123A', { building: '123A', unit: null }],
      
      // Format z oznaczeniem mieszkania
      ['123 m. 45', { building: '123', unit: '45' }],
      ['123 m 45', { building: '123', unit: '45' }],
      ['123 lok. 45', { building: '123', unit: '45' }],
      ['123 lok 45', { building: '123', unit: '45' }],
      ['123 mieszk. 45', { building: '123', unit: '45' }],
      
      // Format z podwójnym numerem
      ['123/45/67', { building: '123/45', unit: '67' }],
      ['4/C/29', { building: '4C', unit: '29' }]
    ];

    cases.forEach(([input, expected]) => {
      expect(normalizeAddressNumbers(input)).toEqual(expected);
    });
  });

  test('powinien zachowywać wielkie litery', () => {
    expect(normalizeAddressNumbers('4c/29a')).toEqual({ building: '4C', unit: '29A' });
    expect(normalizeAddressNumbers('123a m. 45b')).toEqual({ building: '123A', unit: '45B' });
  });

  test('powinien obsługiwać nietypowe formaty', () => {
    expect(normalizeAddressNumbers('123ABC')).toEqual({ building: '123ABC', unit: null });
    expect(normalizeAddressNumbers('123-45')).toEqual({ building: '123-45', unit: null });
  });
});

describe('splitAddressLine', () => {
  test('powinien obsługiwać pusty string', () => {
    expect(splitAddressLine('')).toEqual(getEmptyAddressComponents());
  });

  test('powinien dzielić adresy z usuniętymi prefiksami', () => {
    const cases = [
      [
        'ul. Marszałkowska 1A/2B',
        {
          dpStreet: 'MARSZAŁKOWSKA',
          dpBuilding: '1A',
          dpUnit: '2B'
        }
      ],
      [
        'ULICA Złota 44',
        {
          dpStreet: 'ZŁOTA',
          dpBuilding: '44',
          dpUnit: null
        }
      ],
      [
        'UL. Mickiewicza 15 m. 7',
        {
          dpStreet: 'MICKIEWICZA',
          dpBuilding: '15',
          dpUnit: '7'
        }
      ]
    ];

    cases.forEach(([input, expected]) => {
      const result = splitAddressLine(input as string);
      Object.entries(expected).forEach(([key, value]) => {
        expect(result[key as keyof typeof result]).toBe(value);
      });
    });
  });

  test('powinien dzielić adresy z zachowanymi prefiksami', () => {
    const cases = [
      [
        'Aleja Niepodległości 123/45',
        {
          dpStreet: 'ALEJA NIEPODLEGŁOŚCI',
          dpBuilding: '123',
          dpUnit: '45'
        }
      ],
      [
        'Plac Zbawiciela 5',
        {
          dpStreet: 'PLAC ZBAWICIELA',
          dpBuilding: '5',
          dpUnit: null
        }
      ],
      [
        'Osiedle Tysiąclecia 15 m. 7',
        {
          dpStreet: 'OSIEDLE TYSIĄCLECIA',
          dpBuilding: '15',
          dpUnit: '7'
        }
      ],
      [
        'Rondo ONZ 1',
        {
          dpStreet: 'RONDO ONZ',
          dpBuilding: '1',
          dpUnit: null
        }
      ]
    ];

    cases.forEach(([input, expected]) => {
      const result = splitAddressLine(input as string);
      Object.entries(expected).forEach(([key, value]) => {
        expect(result[key as keyof typeof result]).toBe(value);
      });
    });
  });

  test('powinien obsługiwać adresy bez numeru', () => {
    const cases = [
      ['ul. Marszałkowska', { dpStreet: 'MARSZAŁKOWSKA' }],
      ['Aleja Niepodległości', { dpStreet: 'ALEJA NIEPODLEGŁOŚCI' }],
      ['Plac Zbawiciela', { dpStreet: 'PLAC ZBAWICIELA' }],
      ['Osiedle Tysiąclecia', { dpStreet: 'OSIEDLE TYSIĄCLECIA' }],
      ['Rondo ONZ', { dpStreet: 'RONDO ONZ' }]
    ];

    cases.forEach(([input, expected]) => {
      const result = splitAddressLine(input as string);
      Object.entries(expected).forEach(([key, value]) => {
        expect(result[key as keyof typeof result]).toBe(value);
      });
      expect(result.dpBuilding).toBeNull();
      expect(result.dpUnit).toBeNull();
    });
  });

  test('powinien obsługiwać różne prefiksy dla różnych typów adresów', () => {
    const address = 'Aleja Niepodległości 123/45';
    
    const withDp = splitAddressLine(address, 'dp');
    expect(withDp.dpStreet).toBe('ALEJA NIEPODLEGŁOŚCI');
    expect(withDp.dpBuilding).toBe('123');
    expect(withDp.dpUnit).toBe('45');

    const withPa = splitAddressLine(address, 'pa');
    expect(withPa.paStreet).toBe('ALEJA NIEPODLEGŁOŚCI');
    expect(withPa.paBuilding).toBe('123');
    expect(withPa.paUnit).toBe('45');

    const withSupplier = splitAddressLine(address, 'supplier');
    expect(withSupplier.supplierStreet).toBe('ALEJA NIEPODLEGŁOŚCI');
    expect(withSupplier.supplierBuilding).toBe('123');
    expect(withSupplier.supplierUnit).toBe('45');
  });
}); 