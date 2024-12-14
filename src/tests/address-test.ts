import { testAddressFormats } from '../utils/address-helpers';

const testAddresses = [
  // Różne warianty prefiksu ulicy
  'UL GIEŁDOWA 4C/29',
  'UL. GIEŁDOWA 4C/29',
  'ULICA GIEŁDOWA 4C/29',
  'ul Giełdowa 4C/29',
  'ul. Giełdowa 4C/29',
  'ulica Giełdowa 4C/29',
  'GIEŁDOWA 4C/29',
  
  // Standardowe formaty numerów budynków i mieszkań
  'MARSZAŁKOWSKA 123/45',
  'PUŁAWSKA 12A/34',
  'KRÓLEWSKA 20 m. 15',
  'PIĘKNA 30 lok. 45',
  'ŚWIĘTOKRZYSKA 20/22/15',
  'ZŁOTA 12A',
  
  // Złożone przypadki
  'AL. JEROZOLIMSKIE 123B lok. 45A',
  'PL. KONSTYTUCJI 15C m 67',
  'RONDO ONZ 1/20/30',
  
  // Nietypowe formaty
  'NOWY ŚWIAT 1/3/5 m. 7',
  'KRAKOWSKIE PRZEDMIEŚCIE 15 lok.20A',
  'AL JANA PAWŁA II 12B m.45',
  
  // Przypadki brzegowe
  'WIEJSKA 4/6',
  'MOKOTOWSKA 1A',
  'BRACKA 100 m 200',
  'HOŻA 1/2/3/4'
];

console.log('Rozpoczynam testy formatów adresów...\n');
testAddressFormats(testAddresses);
console.log('\nTesty zakończone.'); 