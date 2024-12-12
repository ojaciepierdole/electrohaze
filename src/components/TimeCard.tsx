'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface TimeCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
  currentValue?: number;
  lastValue?: number;
  avgValue?: number;
  medianValue?: number;
  recordValue?: number;
}

export function TimeCard({
  title,
  value,
  icon: Icon,
  description,
  currentValue,
  lastValue,
  avgValue,
  medianValue,
  recordValue
}: TimeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()} ms</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {(currentValue || lastValue || avgValue || medianValue || recordValue) && (
          <div className="mt-2 space-y-1 text-xs">
            {currentValue !== undefined && (
              <div className="flex justify-between">
                <span>Aktualny:</span>
                <span>{currentValue.toLocaleString()} ms</span>
              </div>
            )}
            {lastValue !== undefined && (
              <div className="flex justify-between">
                <span>Ostatni:</span>
                <span>{lastValue.toLocaleString()} ms</span>
              </div>
            )}
            {avgValue !== undefined && (
              <div className="flex justify-between">
                <span>Średnia:</span>
                <span>{avgValue.toLocaleString()} ms</span>
              </div>
            )}
            {medianValue !== undefined && (
              <div className="flex justify-between">
                <span>Mediana:</span>
                <span>{medianValue.toLocaleString()} ms</span>
              </div>
            )}
            {recordValue !== undefined && recordValue !== Infinity && (
              <div className="flex justify-between">
                <span>Rekord:</span>
                <span>{recordValue.toLocaleString()} ms</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 