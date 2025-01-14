import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScannerDialog } from '@/components/ScannerDialog';
import type { ScannerMode } from '@/components/ScannerModeSelector';

export default function WarehousePage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>('lookup');

  const handleScanComplete = (result: any) => {
    if (result.nextAction) {
      if (result.nextAction.type === 'NAVIGATE') {
        router.push(result.nextAction.data.path);
      }
    }
    setShowScanner(false);
  };

  const handleScanError = (error: string) => {
    toast.error(error);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Warehouse</h1>
      
      <div className="grid gap-4">
        <Button 
          onClick={() => {
            setScannerMode('lookup');
            setShowScanner(true);
          }}
          className="w-full"
        >
          Scan Item
        </Button>

        <Button 
          onClick={() => {
            setScannerMode('movement');
            setShowScanner(true);
          }}
          className="w-full"
          variant="secondary"
        >
          Move Item
        </Button>

        <Button 
          onClick={() => {
            setScannerMode('activation');
            setShowScanner(true);
          }}
          className="w-full"
          variant="secondary"
        >
          Activate Item
        </Button>

        <Button 
          onClick={() => {
            setScannerMode('defect');
            setShowScanner(true);
          }}
          className="w-full"
          variant="secondary"
        >
          Report Defect
        </Button>
      </div>

      <ScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        defaultMode={scannerMode}
        location="WAREHOUSE"
        onScanComplete={handleScanComplete}
        onScanError={handleScanError}
      />
    </div>
  );
} 