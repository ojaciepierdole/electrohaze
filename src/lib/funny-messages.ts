export const funnyMessages = [
  // Biurokratyczne
  "Rebootowanie hamsterów w kołowrotkach...",
  "Kalibrowanie poziomu biurokracji...",
  "Optymalizowanie stosu papierologii...",
  "Synchronizowanie pieczątki z bazą danych...",
  "Obliczanie współczynnika marudzenia...",
  "Formatowanie służbowych długopisów...",
  "Defragmentacja segregatorów...",
  "Indeksowanie spinaczy biurowych...",
  "Aktualizowanie procedur narzekania...",
  "Kompilowanie wymówek na zebranie...",

  // IT i techniczne
  "Debugowanie kwantowej rzeczywistości...",
  "Instalowanie łatek do czwartego wymiaru...",
  "Synchronizowanie neutrin z procesorami...",
  "Optymalizowanie przepływu fotonów...",
  "Kalibrowanie detektora bzdur...",
  "Renderowanie wirtualnej cierpliwości...",
  "Kompresowanie nieskończoności...",
  "Indeksowanie chaosu w kodzie...",
  "Przetwarzanie cyfrowych marzeń...",
  "Aktualizowanie definicji niemożliwego...",

  // Absurdalne
  "Negocjowanie z kosmitami o więcej RAMu...",
  "Przekonywanie bitów do współpracy...",
  "Motywowanie leniwych pikseli...",
  "Medytowanie nad błędami składni...",
  "Przeprogramowywanie praw fizyki...",
  "Hackowanie matrixa dla lepszej wydajności...",
  "Dostrajanie częstotliwości absurdu...",
  "Kompilowanie marzeń sennych AI...",
  "Debugowanie paradoksów czasowych...",
  "Optymalizowanie poziomu chaosu...",

  // Biurowe żarty
  "Liczenie ziarenek kawy w ekspresie...",
  "Synchronizowanie zegarów z czasem kawowym...",
  "Kalibrowanie poziomu kofeiny w systemie...",
  "Optymalizowanie trasy do ekspresu...",
  "Debugowanie procesu parzenia kawy...",
  "Indeksowanie biurowych plotek...",
  "Przetwarzanie weekendowych planów...",
  "Kompilowanie wymówek o spóźnieniu...",
  "Renderowanie wirtualnego urlopu...",
  "Aktualizowanie statusu zmęczenia...",

  // Technologiczne
  "Ładowanie sztucznej inteligencji emocjonalnej...",
  "Synchronizowanie baz danych z przyszłością...",
  "Optymalizowanie algorytmów szczęścia...",
  "Debugowanie międzywymiarowych portali...",
  "Kalibrowanie detektora nonsensu...",
  "Indeksowanie kwantowej superpozycji...",
  "Przetwarzanie alternatywnych rzeczywistości...",
  "Kompilowanie teorii wszystkiego...",
  "Renderowanie piątego wymiaru...",
  "Aktualizowanie praw Murphy'ego...",

  // Filozoficzne
  "Obliczanie sensu życia, wszechświata i całej reszty...",
  "Synchronizowanie świadomości z podświadomością...",
  "Optymalizowanie egzystencjalnych dylematów...",
  "Debugowanie ludzkiej logiki...",
  "Kalibrowanie poziomu metafizyki...",
  "Indeksowanie filozoficznych paradoksów...",
  "Przetwarzanie zbiorowej nieświadomości...",
  "Kompilowanie teorii spiskowych...",
  "Renderowanie abstrakcyjnych koncepcji...",
  "Aktualizowanie definicji rzeczywistości...",

  // Kosmiczne
  "Synchronizowanie z międzygalaktycznym internetem...",
  "Optymalizowanie prędkości nadświetlnej...",
  "Debugowanie czarnych dziur...",
  "Kalibrowanie teleskopów kwantowych...",
  "Indeksowanie pozaziemskich cywilizacji...",
  "Przetwarzanie międzygwiezdnych sygnałów...",
  "Kompilowanie map wszechświata...",
  "Renderowanie alternatywnych galaktyk...",
  "Aktualizowanie stałych kosmologicznych...",
  "Obliczanie prawdopodobieństwa spotkania z UFO...",

  // Magiczne
  "Synchronizowanie różdżek debugujących...",
  "Optymalizowanie zaklęć kompilujących...",
  "Debugowanie magicznych algorytmów...",
  "Kalibrowanie kryształowych kul...",
  "Indeksowanie magicznych artefaktów...",
  "Przetwarzanie alchemicznych formuł...",
  "Kompilowanie zaklęć naprawczych...",
  "Renderowanie magicznych portali...",
  "Aktualizowanie grimoire'ów systemowych...",
  "Obliczanie magicznej entropii...",

  // Surrealistyczne
  "Malowanie cyfrowymi marzeniami...",
  "Komponowanie symfonii z szumu białego...",
  "Destylowanie esencji absurdu...",
  "Katalogowanie niemożliwych możliwości...",
  "Mapowanie krajobrazu snów...",
  "Kolekcjonowanie zaginionych myśli...",
  "Układanie puzzli z fragmentów rzeczywistości...",
  "Nawigowanie przez ocean świadomości...",
  "Żonglowanie kwantowymi kotami...",
  "Tańczenie z cyfrowym chaosem...",

  // Futurystyczne
  "Kalibrowanie wehikułu czasu...",
  "Synchronizowanie linii czasowych...",
  "Optymalizowanie paradoksów temporalnych...",
  "Debugowanie przyszłych błędów...",
  "Indeksowanie alternatywnych historii...",
  "Przetwarzanie przepowiedni technologicznych...",
  "Kompilowanie wizji przyszłości...",
  "Renderowanie holograficznych marzeń...",
  "Aktualizowanie przewidywań AI...",
  "Obliczanie prawdopodobieństwa singularności..."
];

// Funkcja do losowego wybierania komunikatu
export function getRandomMessage(currentMessage: number): number {
  let newMessage;
  do {
    newMessage = Math.floor(Math.random() * funnyMessages.length);
  } while (newMessage === currentMessage);
  return newMessage;
} 