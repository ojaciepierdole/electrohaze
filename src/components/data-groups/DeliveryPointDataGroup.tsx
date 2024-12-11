import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeliveryPointField } from '@/types/fields';
import { formatAddress, formatPostalCode, formatCity, formatStreet } from '@/utils/text-formatting';

interface DeliveryPointDataGroupProps {
  data: DeliveryPointField;
  className?: string;
}

export const DeliveryPointDataGroup: React.FC<DeliveryPointDataGroupProps> = ({ data, className }) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Punkt dostawy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Adres</Badge>
            <span>{formatAddress(data.address)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Kod pocztowy</Badge>
            <span>{formatPostalCode(data.postalCode)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Miasto</Badge>
            <span>{formatCity(data.city)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Ulica</Badge>
            <span>{formatStreet(data.street)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 