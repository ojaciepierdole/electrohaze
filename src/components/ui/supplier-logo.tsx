import * as React from 'react';
import Image from 'next/image';

interface SupplierLogoProps {
  supplierName: string;
  className?: string;
}

export function SupplierLogo({ supplierName, className = '' }: SupplierLogoProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchLogo() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/logo?name=${encodeURIComponent(supplierName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch logo');
        }
        const data = await response.json();
        setLogoUrl(data.url);
      } catch (error) {
        console.error('Error fetching logo:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLogoUrl(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (supplierName) {
      fetchLogo();
    }
  }, [supplierName]);

  if (isLoading) {
    return (
      <div className={`relative flex items-center justify-center ${className} aspect-square rounded-lg border border-gray-100/50`}>
        <div className="w-20 h-20 animate-pulse bg-gray-200/50 rounded" />
      </div>
    );
  }

  if (error || !logoUrl) {
    return null;
  }

  return (
    <div className={`relative flex items-center justify-center ${className} aspect-square rounded-lg border border-gray-100/50 p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-[2px]`}>
      <Image
        src={logoUrl}
        alt={`Logo ${supplierName}`}
        width={80}
        height={80}
        className="object-contain w-20 h-20 drop-shadow-sm"
        unoptimized
      />
    </div>
  );
} 