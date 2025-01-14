import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Package,
  Printer,
  CheckCircle2,
  AlertCircle,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Mock data for packing items
const MOCK_PACKING_ITEMS = [
  {
    itemId: 'ITEM001',
    sku: 'TSH-CLS-BLK-M',
    customerName: 'John Smith',
    orderId: 'ORD-2024-001',
    status: 'awaiting_packing'
  },
  {
    itemId: 'ITEM002',
    sku: 'JNS-SLM-BLU-32',
    customerName: 'Sarah Johnson',
    orderId: 'ORD-2024-002',
    status: 'awaiting_packing'
  },
  {
    itemId: 'ITEM003',
    sku: 'HDY-BLK-L',
    customerName: 'Michael Brown',
    orderId: 'ORD-2024-003',
    status: 'awaiting_packing'
  }
];

// Updated Packing checklist items
const PACKING_CHECKLIST = [
  {
    id: 'item_verification',
    label: 'Item Verification',
    items: [
      'Item ID matches the order',
      'SKU matches the order',
      'Item condition is perfect'
    ]
  },
  {
    id: 'extras',
    label: 'Required Extras',
    items: [
      'Care tags attached',
      'Price tags removed',
      'Order receipt included',
      'Return policy included'
    ]
  },
  {
    id: 'packaging',
    label: 'Packaging',
    items: [
      'Item properly folded',
      'Protective packaging used',
      'Package securely sealed'
    ]
  }
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'awaiting_packing':
      return <Badge variant="warning">Awaiting Packing</Badge>;
    case 'packed':
      return <Badge variant="success">Packed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function Packing() {
  const [packingItems, setPackingItems] = useState(MOCK_PACKING_ITEMS);
  const [selectedItem, setSelectedItem] = useState<typeof MOCK_PACKING_ITEMS[0] | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handlePrintLabel = (item: typeof MOCK_PACKING_ITEMS[0]) => {
    // TODO: Implement printing functionality
    console.log('Printing label for:', item);
  };

  const handleOpenPacking = (item: typeof MOCK_PACKING_ITEMS[0]) => {
    setSelectedItem(item);
  };

  const handleConfirmPacking = () => {
    if (!selectedItem) return;

    // Update item status and remove from packing list
    setPackingItems(prev => prev.filter(item => item.itemId !== selectedItem.itemId));
    
    // Show success message
    setShowSuccessMessage(true);
    
    // Close the dialog
    setSelectedItem(null);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Packing</h1>
          <Box className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                Item successfully packed and ready for shipping
              </div>
            </div>
          </div>
        )}

        {/* Packing Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ORDER ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {packingItems.map((item, index) => (
                  <tr 
                    key={item.itemId}
                    className={cn(
                      'border-b',
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link 
                        href={`/items/${item.itemId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.itemId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{item.sku}</td>
                    <td className="px-4 py-3">{item.customerName}</td>
                    <td className="px-4 py-3">{item.orderId}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintLabel(item)}
                          className="flex items-center gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Print Label
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPacking(item)}
                          className="flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" />
                          Confirm Packing
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packing Confirmation Dialog */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        >
          <Dialog.Title>Packing Confirmation</Dialog.Title>
          <Dialog.Description>
            Please verify all items in the checklist before confirming.
          </Dialog.Description>

          <div className="my-6">
            {/* Item Details Card */}
            <div className="flex flex-col gap-2 mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="font-medium">Item Details</div>
                {selectedItem && getStatusBadge(selectedItem.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Item ID</div>
                  <div className="font-medium">{selectedItem?.itemId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">SKU</div>
                  <div className="font-medium">{selectedItem?.sku}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Order ID</div>
                  <div className="font-medium">{selectedItem?.orderId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedItem?.customerName}</div>
                </div>
              </div>
            </div>

            {/* Packing Checklist */}
            <div className="space-y-6">
              {PACKING_CHECKLIST.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    {section.label}
                  </h4>
                  <div className="space-y-2 pl-4">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Dialog.Footer>
            <Button
              variant="ghost"
              onClick={() => setSelectedItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmPacking}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm Packed
            </Button>
          </Dialog.Footer>
        </Dialog>
      </div>
    </MobileLayout>
  );
} 