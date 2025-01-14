import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ScanLine,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from '@/components/ui/use-toast';

// Mock data for QC items
const MOCK_QC_ITEMS = [
  {
    itemId: 'ITEM001',
    sku: 'TSH-CLS-BLK-M',
    orderNumber: 'ORD-2024-001',
    timestamp: '2024-01-09T14:30:00',
    status: 'qc_pending'
  },
  {
    itemId: 'ITEM002',
    sku: 'JNS-SLM-BLU-32',
    orderNumber: 'ORD-2024-002',
    timestamp: '2024-01-09T15:45:00',
    status: 'qc_pending'
  },
  {
    itemId: 'ITEM003',
    sku: 'HDY-BLK-L',
    orderNumber: 'ORD-2024-003',
    timestamp: '2024-01-09T16:15:00',
    status: 'qc_pending'
  }
];

// QC checklist items
const QC_CHECKLIST = [
  'Verify measurements match specifications',
  'Check stitching quality and consistency',
  'Inspect fabric for defects or damage',
  'Verify color consistency',
  'Check labels and tags'
];

interface ScanState {
  step: 'scan-qr' | 'confirm';
  itemId?: string;
  sku?: string;
  previousStatus?: string;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

export default function QC() {
  const [qcItems, setQcItems] = useState(MOCK_QC_ITEMS);
  const [selectedItem, setSelectedItem] = useState<typeof MOCK_QC_ITEMS[0] | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [scanState, setScanState] = useState<ScanState | null>(null);
  const [showScanSuccessMessage, setShowScanSuccessMessage] = useState(false);

  const handleOpenQC = (item: typeof MOCK_QC_ITEMS[0]) => {
    setSelectedItem(item);
  };

  const handleConfirmQC = () => {
    if (!selectedItem) return;

    // Update item status and remove from QC list
    setQcItems(prev => prev.filter(item => item.itemId !== selectedItem.itemId));
    
    // Show success message
    setShowSuccessMessage(true);
    
    // Close the dialog
    setSelectedItem(null);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleOpenScanner = () => {
    setScanState({
      step: 'scan-qr'
    });
  };

  const handleScanQR = async () => {
    try {
      // Mock scanning QR code
      const response = await fetch('/api/items/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: 'ITEM004',
          scanType: 'REACTIVATE_FROM_LAUNDRY'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate item');
      }

      const data = await response.json();
      
      setScanState(prev => ({
        ...prev!,
        step: 'confirm',
        itemId: data.item.id,
        sku: `${data.item.style}-${data.item.waist}-${data.item.shape}-${data.item.length}-${data.item.wash}`,
        previousStatus: 'LAUNDRY'
      }));
    } catch (error) {
      console.error('Error scanning QR:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to scan QR code',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmScan = async () => {
    if (!scanState) return;

    try {
      // Add item to QC list
      setQcItems(prev => [{
        itemId: scanState.itemId!,
        sku: scanState.sku!,
        orderNumber: 'ORD-2024-004',
        timestamp: new Date().toISOString(),
        status: 'qc_pending'
      }, ...prev]);
      
      // Show success message
      setShowScanSuccessMessage(true);
      
      // Reset scan state
      setScanState(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowScanSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error confirming scan:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm scan',
        variant: 'destructive'
      });
    }
  };

  const handleCompleteQC = async (itemId: string) => {
    try {
      const response = await fetch('/api/items/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          scanType: 'COMPLETE_QC'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete QC');
      }

      // Remove item from QC list
      setQcItems(prev => prev.filter(item => item.itemId !== itemId));
      
      // Show success message
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error completing QC:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete QC',
        variant: 'destructive'
      });
    }
  };

  const renderScanStep = () => {
    if (!scanState) return null;

    switch (scanState.step) {
      case 'scan-qr':
        return (
          <>
            <Dialog.Title>Scan QR Code</Dialog.Title>
            <Dialog.Description>
              Position the QR code within the scanner frame.
            </Dialog.Description>

            <div className="my-6 space-y-4">
              <div className="aspect-square max-w-[240px] mx-auto border-2 border-dashed rounded-lg flex items-center justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
              
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleScanQR}
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Simulate Scan
              </Button>
            </div>
          </>
        );

      case 'confirm':
        return (
          <>
            <Dialog.Title>Confirm Action</Dialog.Title>
            <Dialog.Description>
              Please review and confirm the following action.
            </Dialog.Description>

            <div className="my-6 space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item ID:</span>
                  <span className="text-sm">{scanState.itemId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SKU:</span>
                  <span className="text-sm">{scanState.sku}</span>
                </div>
                <div className="flex items-center justify-center pt-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-sm">Status Update:</span>
                  <span className="text-sm">
                    {scanState.previousStatus} → QC
                  </span>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Quality Control</h1>
          <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Success Messages */}
        {showSuccessMessage && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Item successfully moved to Finishing stage
              </div>
            </div>
          </div>
        )}

        {showScanSuccessMessage && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Item status updated from {scanState?.previousStatus} to QC
              </div>
            </div>
          </div>
        )}

        {/* Scan Dialog */}
        <Dialog open={!!scanState} onOpenChange={() => setScanState(null)}>
          {renderScanStep()}
        </Dialog>

        {/* Activate QR Button Card */}
        <div className="rounded-lg border bg-card p-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleOpenScanner}
            className="w-full flex items-center justify-center gap-2"
          >
            <QrCode className="h-5 w-5" />
            Scan Item from Laundry
          </Button>
        </div>

        {/* QC Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ORDER NUMBER</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TIMESTAMP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {qcItems.map((item) => (
                  <tr key={item.itemId} className="border-b">
                    <td className="px-4 py-3 text-sm">{item.itemId}</td>
                    <td className="px-4 py-3 text-sm">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">{item.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCompleteQC(item.itemId)}
                      >
                        Complete QC
                      </Button>
                    </td>
                  </tr>
                ))}
                {!qcItems.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No items in QC queue
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
} 