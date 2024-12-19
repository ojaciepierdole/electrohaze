import { render } from '@testing-library/react'
import { ProcessingProgress } from '../ProcessingProgress'
import type { ProcessingResult } from '@/types/processing'
import '@testing-library/jest-dom'

describe('ProcessingProgress', () => {
  it('should handle empty results array', () => {
    const { getByText } = render(
      <ProcessingProgress 
        results={[]} 
        currentFileIndex={0}
        totalFiles={0}
        isProcessing={false}
        error={null}
      />
    )
    
    expect(getByText('0 z 0 plików')).toBeInTheDocument()
    expect(getByText('Zatrzymano')).toBeInTheDocument()
  })

  it('should display processing status correctly', () => {
    const mockResults: ProcessingResult[] = [
      { 
        fileName: 'test1.pdf',
        confidence: 0.75,
        processingTime: 0,
        modelResults: [],
        mappedData: {
          metadata: {
            processedAt: new Date().toISOString(),
            status: 'success'
          }
        },
        cacheStats: {
          size: 0,
          maxSize: 100,
          ttl: 3600
        }
      },
      {
        fileName: 'test2.pdf',
        confidence: 0.85,
        processingTime: 0,
        modelResults: [],
        mappedData: {
          metadata: {
            processedAt: new Date().toISOString(),
            status: 'success'
          }
        },
        cacheStats: {
          size: 0,
          maxSize: 100,
          ttl: 3600
        }
      }
    ]

    const { getByText } = render(
      <ProcessingProgress 
        results={mockResults}
        currentFileIndex={2}
        totalFiles={2}
        isProcessing={false}
        error={null}
      />
    )
    
    expect(getByText('2 z 2 plików')).toBeInTheDocument()
    expect(getByText('Zakończono')).toBeInTheDocument()
    expect(getByText('85%')).toBeInTheDocument()
  })

  it('should handle error state', () => {
    const { getByText } = render(
      <ProcessingProgress 
        results={[]}
        currentFileIndex={0}
        totalFiles={1}
        isProcessing={false}
        error="Test error message"
      />
    )
    
    expect(getByText('Błąd przetwarzania')).toBeInTheDocument()
    expect(getByText('Test error message')).toBeInTheDocument()
    expect(getByText('Spróbuj ponownie')).toBeInTheDocument()
  })
}) 