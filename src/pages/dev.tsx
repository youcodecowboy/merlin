import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { 
  Wrench,
  Plus,
  Package,
  ShoppingCart,
  Info,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useMockDataStore } from '@/lib/store';
import { cn, formatDateTime } from '@/lib/utils';
import { generateRandomOrder, generateRandomSKU } from '@/lib/mock';
import type { StoreState, ScanEvent, Unit } from '@/lib/store';

interface ScanWithUnit extends ScanEvent {
  unitId: string;
  sku?: string;
}

interface MetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: Record<string, any>;
}

function MetadataDialog({ isOpen, onClose, metadata }: MetadataDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-x-4 top-[50%] translate-y-[-50%] bg-background rounded-lg shadow-lg z-50 p-6 max-w-lg mx-auto">
        <h2 className="text-lg font-semibold mb-4">Scan Metadata</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Detailed information about the scan event
        </p>
        
        <div className="mt-4 space-y-4">
          {Object.entries(metadata || {}).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </div>
              <div className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
                {typeof value === 'object' 
                  ? JSON.stringify(value, null, 2)
                  : String(value)
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export default function DevDashboard() {
  const addUnit = useMockDataStore(state => state.addUnit);
  const addOrder = useMockDataStore(state => state.addOrder);
  const units = useMockDataStore(state => state.units);
  const recentScans = useMockDataStore(state => state.recentScans).slice(0, 10); // Get 10 most recent scans
  
  const [customSKU, setCustomSKU] = useState('');
  const [customStatus1, setCustomStatus1] = useState('UNCOMMITTED');
  const [customStatus2, setCustomStatus2] = useState('PRODUCTION');
  const [orderSKU, setOrderSKU] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<Record<string, any> | null>(null);

  const handleCreateRandomUnit = () => {
    const unit: Unit = {
      id: `UNIT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status1: 'UNCOMMITTED',
      status2: 'PRODUCTION',
      location: 'WAREHOUSE_A',
      scanHistory: []
    };
    addUnit(unit);
    console.log('Created random unit:', unit);
    setLastCreated({ type: 'unit', data: unit });
  };

  const handleCreateCustomUnit = () => {
    if (!customSKU) return;
    const unit: Unit = {
      id: `UNIT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status1: customStatus1,
      status2: customStatus2,
      location: 'WAREHOUSE_A',
      scanHistory: []
    };
    addUnit(unit);
    console.log('Created custom unit:', unit);
    setLastCreated({ type: 'unit', data: unit });
  };

  const handleCreateRandomOrder = () => {
    const order = generateRandomOrder();
    addOrder(order);
    console.log('Created random order:', order);
    setLastCreated({ type: 'order', data: order });
  };

  const handleCreateSpecificOrder = () => {
    if (!orderSKU) return;
    const order = {
      id: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`,
      items: [
        {
          sku: orderSKU,
          quantity: parseInt(orderQuantity, 10)
        }
      ],
      customerName: 'Test Customer',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    addOrder(order);
    console.log('Created specific order:', order);
    setLastCreated({ type: 'order', data: order });
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Developer Dashboard</h1>
          <Wrench className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Recent Scans Table */}
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Recent QR Code Scans</h2>
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Unit ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Details</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Context</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, index) => (
                    <tr 
                      key={`${scan.unitId}-${scan.timestamp}`}
                      className={cn(
                        'border-b',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      )}
                    >
                      <td className="px-4 py-3 text-sm">
                        {formatDateTime(scan.timestamp || '')}
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          href={`/items/${scan.unitId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {scan.unitId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{scan.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={scan.success ? 'success' : 'danger'}>
                          {scan.success ? 'Success' : 'Failed'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{scan.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                        {scan.details}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">
                          {scan.metadata?.scanContext || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMetadata(scan.metadata || {})}
                          className="flex items-center gap-1"
                        >
                          <Info className="h-4 w-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {recentScans.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No scans recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Metadata Dialog */}
        <MetadataDialog
          isOpen={!!selectedMetadata}
          onClose={() => setSelectedMetadata(null)}
          metadata={selectedMetadata || {}}
        />
      </div>
    </MobileLayout>
  );
} 