import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  ArrowRightLeft, 
  Search, 
  AlertTriangle,
} from 'lucide-react';

export type ScannerMode = 'activation' | 'movement' | 'lookup' | 'defect';

interface ScannerModeSelectorProps {
  onModeSelect: (mode: ScannerMode) => void;
}

export function ScannerModeSelector({ onModeSelect }: ScannerModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Button
        variant="outline"
        size="lg"
        className="flex flex-col items-center gap-2 h-auto py-6"
        onClick={() => onModeSelect('activation')}
      >
        <Zap className="h-8 w-8 text-yellow-500" />
        <div className="text-center">
          <div className="font-semibold">Activation</div>
          <div className="text-xs text-muted-foreground">Activate new units</div>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex flex-col items-center gap-2 h-auto py-6"
        onClick={() => onModeSelect('movement')}
      >
        <ArrowRightLeft className="h-8 w-8 text-blue-500" />
        <div className="text-center">
          <div className="font-semibold">Movement</div>
          <div className="text-xs text-muted-foreground">Move between bins</div>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex flex-col items-center gap-2 h-auto py-6"
        onClick={() => onModeSelect('lookup')}
      >
        <Search className="h-8 w-8 text-green-500" />
        <div className="text-center">
          <div className="font-semibold">Look-up</div>
          <div className="text-xs text-muted-foreground">View item details</div>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex flex-col items-center gap-2 h-auto py-6"
        onClick={() => onModeSelect('defect')}
      >
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <div className="font-semibold">Defect</div>
          <div className="text-xs text-muted-foreground">Report defects</div>
        </div>
      </Button>
    </div>
  );
} 