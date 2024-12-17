import * as React from 'react';

interface UseVirtualizedDataOptions<T> {
  data: T[];
  pageSize?: number;
  preloadPages?: number;
}

interface UseVirtualizedDataReturn<T> {
  virtualizedData: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  loadMore: () => void;
  hasMore: boolean;
}

export function useVirtualizedData<T>({
  data,
  pageSize = 20,
  preloadPages = 2
}: UseVirtualizedDataOptions<T>): UseVirtualizedDataReturn<T> {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [virtualizedData, setVirtualizedData] = React.useState<T[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const dataRef = React.useRef<T[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // Aktualizuj referencję do danych tylko gdy się zmienią
  React.useEffect(() => {
    console.log('Aktualizacja danych:', {
      dataLength: data.length,
      currentVirtualizedLength: virtualizedData.length
    });
    dataRef.current = data;
    setIsInitialized(false); // Reset przy zmianie danych
  }, [data, virtualizedData.length]);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasMore = currentPage < totalPages;

  // Załaduj początkowe dane
  React.useEffect(() => {
    if (isInitialized || !data.length) return;

    console.log('Inicjalizacja danych:', {
      pageSize,
      currentPage,
      totalItems: data.length
    });

    const initialData = data.slice(0, pageSize);
    setVirtualizedData(initialData);
    setIsInitialized(true);
  }, [isInitialized, data.length, pageSize, currentPage]);

  // Zoptymalizowana funkcja do ładowania kolejnej strony danych
  const loadMore = React.useCallback(() => {
    if (isLoading || !hasMore || !isInitialized) return;

    console.log('Ładowanie kolejnej strony:', {
      currentPage,
      totalPages,
      hasMore
    });

    setIsLoading(true);
    
    // Użyj requestAnimationFrame dla lepszej wydajności UI
    requestAnimationFrame(() => {
      const nextPage = currentPage + 1;
      const start = currentPage * pageSize;
      const end = start + pageSize;
      
      console.log('Pobieranie danych:', { start, end });
      
      // Użyj referencji do danych zamiast prop
      const newData = dataRef.current.slice(start, end);
      console.log('Nowe dane:', newData.length);
      
      setVirtualizedData(prevData => {
        // Unikaj duplikatów
        const lastItem = prevData[prevData.length - 1];
        const firstNewItem = newData[0];
        
        if (lastItem === firstNewItem) {
          console.log('Znaleziono duplikat, pomijam pierwszy element');
          return [...prevData, ...newData.slice(1)];
        }
        
        return [...prevData, ...newData];
      });
      
      setCurrentPage(nextPage);
      setIsLoading(false);
    });
  }, [currentPage, hasMore, isLoading, pageSize, isInitialized]);

  // Automatyczne ładowanie kolejnych stron
  React.useEffect(() => {
    if (!isInitialized) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const remainingItems = virtualizedData.length - (currentPage - 1) * pageSize;
    if (remainingItems < pageSize * 2 && hasMore && !isLoading) {
      console.log('Automatyczne ładowanie kolejnej strony:', {
        remainingItems,
        threshold: pageSize * 2
      });
      timeoutRef.current = setTimeout(loadMore, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPage, hasMore, isLoading, pageSize, isInitialized, virtualizedData.length, loadMore]);

  return {
    virtualizedData,
    totalItems,
    currentPage,
    totalPages,
    isLoading,
    loadMore,
    hasMore
  };
} 