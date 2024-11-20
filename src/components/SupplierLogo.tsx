import Image from 'next/image';
import { useMemo } from 'react';
import { getLogoUrl } from '@/lib/logo-helpers';

interface SupplierLogoProps {
  supplierName: string;
  size?: number;
}

export function SupplierLogo({ supplierName, size = 40 }: SupplierLogoProps) {
  const logoUrl = useMemo(() => {
    return getLogoUrl(supplierName);
  }, [supplierName]);

  return (
    <div className="relative">
      <Image
        src={logoUrl}
        alt={`Logo ${supplierName}`}
        width={size}
        height={size}
        className="rounded-md object-contain"
        onError={(e) => {
          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(supplierName)}&background=random&size=${size * 2}`;
          if (e.currentTarget.src !== fallbackUrl) {
            e.currentTarget.src = fallbackUrl;
          }
        }}
        unoptimized
      />
    </div>
  );
} 