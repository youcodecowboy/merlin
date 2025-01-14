import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Sparkles,
  CheckCircle2,
  QrCode,
  MapPin,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for finishing items
const MOCK_FINISHING_ITEMS = [
  {
    id: 'FIN001',
    orderNumber: 'ORD-2024-001',
    sku: 'JNS-SLM-BLU-32',
    buttonCode: 'BTN-437',
    hemLength: '32"',
    nameTag: 'CLASSIC-NT',
    steps: {
      button: false,
      hem: false,
      nameTag: false
    },
    newLocation: ''
  },
  {
    id: 'FIN002',
    orderNumber: 'ORD-2024-002',
    sku: 'JNS-REG-BLK-34',
    buttonCode: 'BTN-215',
    hemLength: '34"',
    nameTag: 'PREMIUM-NT',
    steps: {
      button: true,
      hem: false,
      nameTag: false
    },
    newLocation: ''
  },
  {
    id: 'FIN003',
    orderNumber: 'ORD-2024-003',
    sku: 'JNS-SLM-GRY-30',
    buttonCode: 'BTN-654',
    hemLength: '30"',
    nameTag: 'CLASSIC-NT',
    steps: {
      button: false,
      hem: false,
      nameTag: false
    },
    newLocation: ''
  }
];

const FINISHING_STEPS = [
  { 
    key: 'button', 
    label: 'Button Attachment',
    getDetail: (item: typeof MOCK_FINISHING_ITEMS[0]) => `Attach button ${item.buttonCode}`
  },
  { 
    key: 'hem', 
    label: 'Hemming',
    getDetail: (item: typeof MOCK_FINISHING_ITEMS[0]) => `Hem to ${item.hemLength}`
  },
  { 
    key: 'nameTag', 
    label: 'Name Tag',
    getDetail: (item: typeof MOCK_FINISHING_ITEMS[0]) => `Attach ${item.nameTag}`
  }
];

export default function Finishing() {
  const [finishingItems, setFinishingItems] = useState(MOCK_FINISHING_ITEMS);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [scanningLocation, setScanningLocation] = useState<string | null>(null);

  const updateStep = (itemId: string, step: keyof typeof MOCK_FINISHING_ITEMS[0]['steps']) => {
    setFinishingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            steps: { ...item.steps, [step]: !item.steps[step] } 
          } 
        : item
    ));
  };

  const handleScanLocation = (itemId: string) => {
    setScanningLocation(itemId);
  };

  const handleLocationScanned = (itemId: string, location: string) => {
    setFinishingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, newLocation: location }
        : item
    ));
    setScanningLocation(null);
    completeItem(itemId);
  };

  const completeItem = (id: string) => {
    setFinishingItems(prev => prev.filter(item => item.id !== id));
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const getCompletionStatus = (steps: typeof MOCK_FINISHING_ITEMS[0]['steps']) => {
    const total = Object.keys(steps).length;
    const completed = Object.values(steps).filter(Boolean).length;
    return { completed, total };
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Finishing</h1>
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Item successfully completed and moved to next stage
              </div>
            </div>
          </div>
        )}

        {/* Finishing Cards */}
        <div className="grid gap-4">
          {finishingItems.map((item) => {
            const { completed, total } = getCompletionStatus(item.steps);
            const allStepsComplete = completed === total;
            
            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Card Header */}
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{item.orderNumber}</div>
                    <Badge variant="secondary" className="ml-2">
                      {completed}/{total} Steps
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {item.sku}
                    </div>
                    <div className="text-primary font-medium">
                      Button: {item.buttonCode}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4 grid gap-3">
                  {FINISHING_STEPS.map((step) => (
                    <button
                      key={step.key}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors",
                        item.steps[step.key as keyof typeof item.steps]
                          ? "bg-primary/10 border-primary/20"
                          : "bg-background border-input hover:bg-muted"
                      )}
                      onClick={() => updateStep(item.id, step.key as keyof typeof item.steps)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                          item.steps[step.key as keyof typeof item.steps]
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        )}>
                          {item.steps[step.key as keyof typeof item.steps] && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                        </div>
                        <span>{step.label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {step.getDetail(item)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Location Scanning */}
                {allStepsComplete && (
                  <div className="p-4 pt-0">
                    <Button
                      variant="default"
                      className="w-full gap-2"
                      onClick={() => handleScanLocation(item.id)}
                    >
                      <QrCode className="h-4 w-4" />
                      Scan New Location
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Location Scanning Dialog */}
        <Dialog
          open={!!scanningLocation}
          onOpenChange={(open) => {
            if (!open) setScanningLocation(null);
          }}
        >
          <Dialog.Title>Scan New Location</Dialog.Title>
          <Dialog.Description>
            Please scan the QR code of the new location for this item.
          </Dialog.Description>

          <div className="my-6">
            <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">
                  Waiting for location scan...
                </div>
              </div>
            </div>
          </div>

          <Dialog.Footer>
            <Button
              variant="secondary"
              onClick={() => setScanningLocation(null)}
            >
              Cancel
            </Button>
            {/* Simulating a scan for demo purposes */}
            <Button
              variant="default"
              onClick={() => scanningLocation && handleLocationScanned(scanningLocation, 'QC-AREA-01')}
            >
              Simulate Scan
            </Button>
          </Dialog.Footer>
        </Dialog>
      </div>
    </MobileLayout>
  );
} 