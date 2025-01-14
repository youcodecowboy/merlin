import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { QrScanner } from '@/components/QrScanner';
import { 
  Package,
  ScanLine,
  CheckCircle2,
  MapPin,
  Timer,
  ArrowRightCircle
} from 'lucide-react';
import Link from 'next/link';

// Types
interface FindRequest {
  id: string;
  itemId: string;
  sku: string;
  location: string;
  binNumber: string;
  orderId: string;
  customerName: string;
  status: 'pending' | 'in_progress' | 'found' | 'not_found';
  requestedAt: string;
  needsWash: boolean;
}

// Mock data for find requests
const MOCK_FIND_REQUESTS: FindRequest[] = [
  {
    id: 'FR001',
    itemId: 'ITEM004',
    sku: 'ST-32-X-32-RAW',
    location: 'WAREHOUSE_A',
    binNumber: 'A123',
    orderId: 'ORD-2024-001',
    customerName: 'John Smith',
    status: 'pending' as const,
    requestedAt: new Date(2024, 0, 9, 16, 45).toISOString(),
    needsWash: true
  },
  {
    id: 'FR002',
    itemId: 'ITEM005',
    sku: 'ST-34-X-34-STA',
    location: 'WAREHOUSE_B',
    binNumber: 'B456',
    orderId: 'ORD-2024-002',
    customerName: 'Jane Doe',
    status: 'in_progress' as const,
    requestedAt: new Date(2024, 0, 9, 16, 30).toISOString(),
    needsWash: false
  },
  {
    id: 'FR003',
    itemId: 'ITEM006',
    sku: 'ST-36-X-36-IND',
    location: 'WAREHOUSE_A',
    binNumber: 'A789',
    orderId: 'ORD-2024-003',
    customerName: 'Bob Wilson',
    status: 'pending' as const,
    requestedAt: new Date(2024, 0, 9, 16, 15).toISOString(),
    needsWash: true
  }
].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}

function getStatusBadge(status: FindRequest['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="warning">In Progress</Badge>;
    case 'found':
      return <Badge variant="success">Found</Badge>;
    case 'not_found':
      return <Badge variant="danger">Not Found</Badge>;
    default:
      return null;
  }
}

export default function FindRequests() {
  const [scanState, setScanState] = useState<{
    step: 'scan-item' | 'show-location' | 'scan-new-bin' | 'confirm';
    itemId?: string;
    requestId?: string;
    currentLocation?: {
      location: string;
      binNumber: string;
    };
    targetLocation?: {
      location: string;
      binNumber: string;
    };
    needsWash?: boolean;
  } | null>(null);

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleScanItem = (request: FindRequest) => {
    setScanState({ 
      step: 'scan-item',
      requestId: request.id,
      currentLocation: {
        location: request.location,
        binNumber: request.binNumber
      },
      targetLocation: request.needsWash ? {
        location: 'WASH AREA',
        binNumber: 'W123'
      } : {
        location: 'FINISHING',
        binNumber: 'F123'
      },
      needsWash: request.needsWash
    });
  };

  const handleConfirm = () => {
    setScanState(null);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleScanResult = (result: string) => {
    // Here we'll handle the scan result based on the current step
    if (scanState?.step === 'scan-item') {
      // Verify the scanned item matches the request
      setScanState(prev => ({
        ...prev!,
        step: 'show-location',
        itemId: result
      }));
    } else if (scanState?.step === 'scan-new-bin') {
      // Verify the scanned bin matches the target location
      setScanState(prev => ({
        ...prev!,
        step: 'confirm'
      }));
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  const renderScanStep = () => {
    switch (scanState?.step) {
      case 'scan-item':
        return (
          <>
            <Dialog.Title>Scan Item QR Code</Dialog.Title>
            <Dialog.Description>
              Scan the item's QR code to verify
            </Dialog.Description>
            <div className="p-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <QrScanner
                  onResult={handleScanResult}
                  onError={handleScanError}
                  className="w-full h-full"
                />
              </div>
            </div>
          </>
        );

      case 'show-location':
        return (
          <>
            <Dialog.Title>Move Item To</Dialog.Title>
            <Dialog.Description>
              Take the item to this location:
            </Dialog.Description>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center space-y-3">
                <MapPin className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <div className="text-3xl font-bold text-primary">{scanState.targetLocation?.location}</div>
                  <div className="text-2xl font-semibold">Bin {scanState.targetLocation?.binNumber}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Current location: {scanState.currentLocation?.location} - Bin {scanState.currentLocation?.binNumber}
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setScanState(prev => ({ 
                  ...prev!,
                  step: 'scan-new-bin'
                }))}
              >
                Ready to Scan New Location
              </Button>
            </div>
          </>
        );

      case 'scan-new-bin':
        return (
          <>
            <Dialog.Title>Scan New Location</Dialog.Title>
            <Dialog.Description>
              Scan the QR code of the new bin location
            </Dialog.Description>
            <div className="p-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <QrScanner
                  onResult={handleScanResult}
                  onError={handleScanError}
                  className="w-full h-full"
                />
              </div>
            </div>
          </>
        );

      case 'confirm':
        return (
          <>
            <Dialog.Title>Confirm Move</Dialog.Title>
            <Dialog.Description>
              Please review the item move details
            </Dialog.Description>
            <div className="p-4 space-y-4">
              <div className="rounded-lg border bg-muted p-4 space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Item ID</div>
                  <div className="font-medium">{scanState.itemId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="font-medium">{scanState.currentLocation?.location} - Bin {scanState.currentLocation?.binNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">To</div>
                  <div className="font-medium">{scanState.targetLocation?.location} - Bin {scanState.targetLocation?.binNumber}</div>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Find Requests</h1>
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Item successfully found and processed
              </div>
            </div>
          </div>
        )}

        {/* Find Request Cards */}
        <div className="space-y-4">
          {MOCK_FIND_REQUESTS.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{request.itemId}</h3>
                      <p className="text-sm text-muted-foreground">{request.sku}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Location: {request.location} - Bin {request.binNumber}</span>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Order ID</div>
                    <div className="font-medium">{request.orderId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Customer</div>
                    <div className="font-medium">{request.customerName}</div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span>Requested: {formatDateTime(request.requestedAt)}</span>
                  </div>
                </div>

                {/* Next Step Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRightCircle className="h-4 w-4" />
                  <span>Next step: {request.needsWash ? 'Wash Queue' : 'Finishing'}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleScanItem(request)}
                  >
                    Scan Item
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Scanner Dialog */}
        <Dialog
          open={!!scanState}
          onOpenChange={(open) => {
            if (!open) setScanState(null);
          }}
        >
          {renderScanStep()}
          <Dialog.Footer>
            <Button
              variant="ghost"
              onClick={() => setScanState(null)}
            >
              Cancel
            </Button>
            {scanState?.step === 'confirm' && (
              <Button
                variant="primary"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            )}
          </Dialog.Footer>
        </Dialog>
      </div>
    </MobileLayout>
  );
} 