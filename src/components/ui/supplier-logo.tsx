import * as React from 'react';
import Image from 'next/image';
import { getDomain } from '@/lib/logo-helpers';

interface SupplierLogoProps {
  supplierName: string;
  size?: number;
  className?: string;
}

export function SupplierLogo({ supplierName, size = 32, className = '' }: SupplierLogoProps) {
  const logoUrl = React.useMemo(() => {
    const domain = getDomain(supplierName);
    return `/api/logo?domain=${encodeURIComponent(domain)}&size=${size}`;
  }, [supplierName, size]);

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={logoUrl}
        alt={`Logo ${supplierName}`}
        width={size}
        height={size}
        className="object-contain"
        loading="lazy"
        unoptimized
      />
    </div>
  );
} 