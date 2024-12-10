import * as React from 'react';

interface Size {
  width: number | null;
  height: number | null;
}

export function useElementSize(): [React.RefObject<HTMLDivElement>, Size] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<Size>({ width: null, height: null });

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size];
} 