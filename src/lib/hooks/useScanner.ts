import { useState } from 'react'

interface ScanOptions {
  type: string
  location?: string
}

interface ScanResult {
  ok: boolean
  scanEvent?: any
  error?: string
}

export function useScanner() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recordScan = async (
    qrCode: string,
    options: ScanOptions
  ): Promise<ScanResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode,
          type: options.type,
          location: options.location,
          success: true,
          metadata: {
            scanContext: 'QR_SCANNER',
            scanLocation: options.location,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record scan')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record scan'
      setError(errorMessage)
      return {
        ok: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const recordScanError = async (
    options: ScanOptions,
    errorDetails: string
  ): Promise<ScanResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: 'UNKNOWN',
          type: options.type,
          location: options.location,
          success: false,
          metadata: {
            error: errorDetails,
            scanContext: 'QR_SCANNER',
            scanLocation: options.location,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record scan error')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record scan error'
      setError(errorMessage)
      return {
        ok: false,
        error: errorMessage,
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    recordScan,
    recordScanError,
    isLoading,
    error,
  }
} 