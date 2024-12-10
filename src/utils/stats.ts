export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function calculateConfidence(confidences: number[]): number {
  if (confidences.length === 0) return 0;
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
} 