import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useRouter } from 'next/router';
import { useToast } from '@/components/ui/use-toast';
import type { ScannerMode } from './ScannerModeSelector';
import { cn } from '@/lib/utils';

export interface QrScannerProps {
  mode: string;
  location?: string;
  onScanComplete?: (data: any) => void;
  onScanError?: (error: Error) => void;
  onClose?: () => void;
  onResult?: (decodedText: string) => Promise<void>;
  onError?: (error: Error) => void;
  className?: string;
}

export function QrScanner({ 
  mode, 
  location, 
  onScanComplete, 
  onScanError, 
  onClose,
  onResult,
  onError,
  className 
}: QrScannerProps) {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastErrorRef = useRef<number>(0);
  const { toast } = useToast();

  // Helper to check if an error is a "no code detected" error
  const isNoCodeError = (message: string) => {
    const noCodeMessages = [
      'No barcode or QR code detected',
      'No MultiFormat Readers were able to detect the code',
      'NotFoundException',
      'No QR code found'
    ];
    return noCodeMessages.some(msg => message.includes(msg));
  };

  // Cleanup function to properly clear the scanner
  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error clearing scanner:', error);
      }
    }
  };

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeScanner = async () => {
      try {
        // Clean up any existing scanner
        await cleanupScanner();

        const qrReader = document.getElementById('qr-reader');
        if (!qrReader) {
          throw new Error('QR reader element not found');
        }

        // Clear any existing content
        qrReader.innerHTML = '';

        // Create new scanner instance
        scannerRef.current = new Html5Qrcode('qr-reader');
        
        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          throw new Error('No cameras found. Please ensure camera permissions are granted.');
        }
        
        // Start scanner with camera
        await scannerRef.current.start(
          cameras[0].id,
          {
            fps: 2,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            videoConstraints: {
              facingMode: "environment"
            }
          },
          handleScanSuccess,
          (errorMessage: string) => {
            if (!isNoCodeError(errorMessage)) {
              const now = Date.now();
              if (now - lastErrorRef.current > 1000) {
                lastErrorRef.current = now;
                handleScanError(new Error(errorMessage));
              }
            }
          }
        );
        
        setIsScanning(true);
        setError(null);

      } catch (err) {
        console.error('Scanner initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize scanner';
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying scanner initialization (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(initializeScanner, 1000);
        } else {
          setError(`Camera initialization failed: ${errorMessage}. Please ensure camera permissions are granted and try again.`);
          if (onError) {
            onError(new Error(errorMessage));
          }
        }
      }
    };

    initializeScanner();

    return () => {
      cleanupScanner();
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      setIsScanning(false);
      if (scannerRef.current) {
        await scannerRef.current.pause();
      }

      // If onResult is provided, use it instead of the default scan handling
      if (onResult) {
        await onResult(decodedText);
        return;
      }

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: decodedText,
          type: mode.toUpperCase() + '_SCAN',
          location,
          success: true
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      // Handle scan success
      if (onScanComplete) {
        onScanComplete(data);
      }

      // Handle next action
      if (data.nextAction) {
        switch (data.nextAction.type) {
          case 'NAVIGATE':
            toast({
              description: data.nextAction.message
            });
            router.push(data.nextAction.data.path);
            break;
          case 'AWAIT_DESTINATION':
            toast({
              description: data.nextAction.message
            });
            // Keep scanner open for destination scan
            if (scannerRef.current) {
              await scannerRef.current.resume();
              setIsScanning(true);
            }
            break;
          default:
            console.warn('Unknown next action type:', data.nextAction.type);
        }
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process scan');
      handleScanError(error);
    }
  };

  const handleScanError = (error: Error) => {
    // Ignore all "no code detected" errors
    if (isNoCodeError(error.message)) {
      return;
    }

    setIsScanning(false);
    handleError(error.message);
    if (onScanError) {
      onScanError(error);
    }
    // Resume scanning after error
    if (scannerRef.current) {
      scannerRef.current.resume();
      setIsScanning(true);
    }
  };

  const handleError = (message: string) => {
    // Don't show toast for "no code detected" errors
    if (!isNoCodeError(message)) {
      console.error('Scanner error:', message);
      toast({
        description: message,
        variant: 'destructive',
      });
      
      if (onError) {
        onError(new Error(message));
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center w-full h-full", className)}>
      <div id="qr-reader" className="w-full aspect-square bg-muted" />
      {error && !isNoCodeError(error) && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
} 