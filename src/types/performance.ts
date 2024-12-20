export interface PerformanceStats {
  name: string;
  duration: number;
  timestamp: string;
  count?: number;
  totalDuration?: number;
  averageDuration?: number;
  minDuration?: number;
  maxDuration?: number;
  lastDuration?: number;
} 