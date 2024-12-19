import { ProcessingTiming, TimingStats } from '../types/timing';

export class TimingCalculator {
  private timings: ProcessingTiming[] = [];
  
  addTiming(timing: ProcessingTiming) {
    this.timings.push(timing);
  }

  calculateStats(): TimingStats {
    if (this.timings.length === 0) {
      return this.getEmptyStats();
    }

    // Znajdź globalny początek i koniec
    const globalStart = Math.min(...this.timings.map(t => t.uploadStartTime));
    const globalEnd = Math.max(...this.timings.map(t => t.analysisEndTime));
    
    // Oblicz rzeczywisty całkowity czas
    const totalTime = globalEnd - globalStart;

    // Oblicz sumy czasów poszczególnych etapów
    const stats = this.timings.reduce((acc, timing) => {
      acc.uploadTime += timing.uploadEndTime - timing.uploadStartTime;
      acc.ocrTime += timing.ocrEndTime - timing.ocrStartTime;
      acc.analysisTime += timing.analysisEndTime - timing.analysisStartTime;
      return acc;
    }, this.getEmptyStats());

    stats.documentsProcessed = this.timings.length;
    stats.parallelProcessing = this.detectParallelProcessing();
    stats.totalTime = totalTime;
    stats.averageTimePerDocument = totalTime / stats.documentsProcessed;

    return stats;
  }

  private detectParallelProcessing(): boolean {
    // Sprawdzamy czy występują nakładające się przedziały czasowe
    for (let i = 0; i < this.timings.length; i++) {
      for (let j = i + 1; j < this.timings.length; j++) {
        if (this.hasTimeOverlap(this.timings[i], this.timings[j])) {
          return true;
        }
      }
    }
    return false;
  }

  private hasTimeOverlap(a: ProcessingTiming, b: ProcessingTiming): boolean {
    const aStart = a.uploadStartTime;
    const aEnd = a.analysisEndTime;
    const bStart = b.uploadStartTime;
    const bEnd = b.analysisEndTime;
    
    return (aStart <= bEnd && bStart <= aEnd);
  }

  private getEmptyStats(): TimingStats {
    return {
      uploadTime: 0,
      ocrTime: 0,
      analysisTime: 0,
      totalTime: 0,
      averageTimePerDocument: 0,
      documentsProcessed: 0,
      parallelProcessing: false
    };
  }
} 