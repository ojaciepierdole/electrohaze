'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TimeCardProps {
  title: string;
  icon: LucideIcon;
  currentValue: number;
  lastValue: number;
  avgValue: number;
  medianValue: number;
  recordValue: number;
}

export function TimeCard({
  title,
  icon: Icon,
  currentValue,
  lastValue,
  avgValue,
  medianValue,
  recordValue
}: TimeCardProps) {
  const formatTime = (ms: number) => {
    if (ms === Infinity) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Aktualny:</span>
          <span className="text-sm font-medium text-white">{formatTime(currentValue)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Poprzedni:</span>
          <span className="text-sm font-medium text-white">{formatTime(lastValue)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Średnia:</span>
          <span className="text-sm font-medium text-white">{formatTime(avgValue)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Mediana:</span>
          <span className="text-sm font-medium text-white">{formatTime(medianValue)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Rekord:</span>
          <span className="text-sm font-medium text-green-400">{formatTime(recordValue)}</span>
        </div>
      </div>
    </Card>
  );
} 