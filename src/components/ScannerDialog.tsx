import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  ArrowRightLeft, 
  Search, 
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import type { ScannerMode } from './ScannerModeSelector';
import { QrScanner } from './QrScanner';
import { cn } from '@/lib/utils';

interface ScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete?: (result: any) => void;
  onScanError?: (error: string) => void;
  location?: string;
  defaultMode?: ScannerMode;
}

export function ScannerDialog({ 
  open, 
  onOpenChange, 
  onScanComplete,
  onScanError,
  location,
  defaultMode = 'lookup'
}: ScannerDialogProps) {
  const [mode, setMode] = useState<ScannerMode>(defaultMode);
  const [isChangingMode, setIsChangingMode] = useState(false);

  const handleScanComplete = async (result: any) => {
    if (onScanComplete) {
      await onScanComplete(result);
    }
    onOpenChange(false);
  };

  const handleScanError = (error: string) => {
    console.error('[SCANNER] Error:', error);
    if (onScanError) {
      onScanError(error);
    }
  };

  const handleModeChange = async (newMode: ScannerMode) => {
    setIsChangingMode(true);
    setMode(newMode);
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsChangingMode(false);
  };

  const getModeDescription = (mode: ScannerMode) => {
    switch (mode) {
      case 'activation':
        return 'Scan to activate new unit';
      case 'movement':
        return 'Scan item, then scan destination';
      case 'lookup':
        return 'Scan to view item details';
      case 'defect':
        return 'Scan to report item defect';
    }
  };

  const ModeButton = ({ targetMode, icon: Icon }: { 
    targetMode: ScannerMode; 
    icon: React.ElementType;
  }) => (
    <Button
      variant={mode === targetMode ? "default" : "outline"}
      size="icon"
      className="h-12 w-12"
      onClick={() => handleModeChange(targetMode)}
      disabled={isChangingMode}
    >
      {isChangingMode && mode === targetMode ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className={cn(
          "h-5 w-5",
          mode === targetMode ? "text-white" : {
            'text-yellow-500': targetMode === 'activation',
            'text-blue-500': targetMode === 'movement',
            'text-green-500': targetMode === 'lookup',
            'text-red-500': targetMode === 'defect',
          }
        )} />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-[min(500px,90vh)] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">
                {mode === 'activation' && 'Activate Unit'}
                {mode === 'movement' && 'Move Item'}
                {mode === 'lookup' && 'Look Up Item'}
                {mode === 'defect' && 'Report Defect'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getModeDescription(mode)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scanner Container */}
          <div className="aspect-square w-full relative bg-muted">
            {isChangingMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <QrScanner
              mode={mode}
              location={location}
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
              onClose={() => onOpenChange(false)}
            />
          </div>

          {/* Mode Toggles */}
          <div className="p-4 border-t bg-background shrink-0">
            <div className="flex justify-center gap-4">
              <ModeButton
                targetMode="activation"
                icon={Zap}
              />
              <ModeButton
                targetMode="movement"
                icon={ArrowRightLeft}
              />
              <ModeButton
                targetMode="lookup"
                icon={Search}
              />
              <ModeButton
                targetMode="defect"
                icon={AlertTriangle}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 