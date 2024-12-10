import Image from 'next/image';
import { useMemo, useState } from 'react';
import { getLogoUrl } from '@/lib/logo-helpers';

interface SupplierLogoProps {
  supplierName: string;
  size?: number;
}

export function SupplierLogo({ supplierName, size = 40 }: SupplierLogoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const logoUrl = useMemo(() => {
    return getLogoUrl(supplierName);
  }, [supplierName]);

  const fallbackUrl = useMemo(() => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(supplierName)}&background=random&size=${size * 2}`;
  }, [supplierName, size]);

  return (
    <div className="relative">
      {!hasError ? (
        <Image
          src={logoUrl}
          alt={`Logo ${supplierName}`}
          width={size}
          height={size}
          className={`rounded-md object-contain transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          loading="lazy"
          unoptimized
        />
      ) : (
        <Image
          src={fallbackUrl}
          alt={`Logo ${supplierName}`}
          width={size}
          height={size}
          className="rounded-md object-contain"
          unoptimized
        />
      )}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-md animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
} 