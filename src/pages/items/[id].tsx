import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrScanner } from '@/components/QrScanner';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { 
  Package, 
  Printer,
  QrCode,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  MapPin,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  XCircle,
  Shirt,
  Waves,
  Ruler,
  Box,
  PackageCheck,
  Truck,
  RefreshCcw,
  ClipboardCheck,
  Search,
  Power,
  Scissors,
  CheckCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/lib/utils';

interface ScanEvent {
  id: string;
  itemId: string;
  type: string;
  timestamp: Date;
  location: string | null;
  success: boolean;
  metadata: any;
}

interface OrderDetails {
  id: string;
  customerName: string;
  orderDate: Date;
  targetSku: {
    style: string;
    waist: string;
    shape: string;
    length: string;
    wash: string;
  };
  priority: 'high' | 'medium' | 'low';
  status: string;
  hemType: string;
  buttonColor: string;
}

interface ItemDetails {
  id: string;
  qrCode: string;
  style: string;
  waist: number;
  length: number;
  shape: string;
  wash: string;
  fabric: string;
  status1: string;
  status2: string;
  location: string | null;
  batchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  scanEvents: ScanEvent[];
  order: OrderDetails | null;
}

interface WorkflowStep {
  title: string;
  description: string | React.ReactNode;
  icon: React.ReactNode;
  status: 'upcoming' | 'current' | 'completed';
  action?: React.ReactNode;
}

function WorkflowCard({ item, router, setShowScanner, setScanType, setScanning }: { 
  item: ItemDetails; 
  router: any;
  setShowScanner: (show: boolean) => void;
  setScanType: (type: string) => void;
  setScanning: (scanning: boolean) => void;
}) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const triggerScanner = () => {
    // For storage queue items or wash queue items, use movement scan type
    if (item.status2 === 'STORAGE_QUEUE' || item.status2 === 'WASH_QUEUE') {
      setScanType('movement');
    } else {
      // For other statuses, use the default scan type based on status
      switch (item.status2) {
        case 'PRODUCTION':
          setScanType('activation');
          break;
        case 'LAUNDRY':
          setScanType('activation');
          break;
        case 'QC':
          setScanType('lookup');
          break;
        case 'FINISHING':
          setScanType('lookup');
          break;
        case 'PACKING':
          setScanType('lookup');
          break;
        case 'SHIPPING':
          setScanType('lookup');
          break;
        default:
          setScanType('lookup');
      }
    }
    setScanning(true);
    setShowScanner(true);
  };

  const workflowSteps = useMemo((): WorkflowStep[] => {
    if (item.status2 === 'PRODUCTION') {
      return [{
        title: t('inventory.itemDetails.workflow.completeProduction'),
        description: t('inventory.itemDetails.workflow.completeProductionDesc'),
        icon: <ClipboardCheck className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.qrCode.verify')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'POST_PRODUCTION') {
      return [{
        title: t('inventory.itemDetails.workflow.activateItem'),
        description: t('inventory.itemDetails.workflow.activateDesc'),
        icon: <Power className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.qrCode.activate')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'STOCK') {
      return [{
        title: t('inventory.itemDetails.workflow.inStorage'),
        description: t('inventory.itemDetails.workflow.inStorageDesc'),
        icon: <Package className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.moveUnit')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'WASH_QUEUE') {
      return [{
        title: t('inventory.itemDetails.workflow.moveToWash'),
        description: (
          <div className="space-y-4">
            <p>{t('inventory.itemDetails.workflow.readyForWashing')}</p>
            <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <Waves className="h-6 w-6 text-blue-500 animate-pulse" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Move to Wash Bin:</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{item.wash.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        ),
        icon: <Waves className="h-5 w-5 animate-pulse" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.moveToWashBin')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'WASHING') {
      return [{
        title: t('inventory.itemDetails.workflow.completeWashing'),
        description: t('inventory.itemDetails.workflow.completeWashingDesc'),
        icon: <Waves className="h-5 w-5 animate-pulse" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.qrCode.verify')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'LAUNDRY') {
      return [{
        title: t('inventory.itemDetails.workflow.reactivateFromLaundry'),
        description: t('inventory.itemDetails.workflow.reactivateDesc'),
        icon: <Power className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.scanToReactivate')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'QC') {
      return [{
        title: t('inventory.itemDetails.workflow.qualityControl'),
        description: t('inventory.itemDetails.workflow.qcInspectionRequired'),
        icon: <CheckCircle className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.completeQC')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'FINISHING') {
      return [{
        title: t('inventory.itemDetails.workflow.finishing'),
        description: t('inventory.itemDetails.workflow.finishingDesc'),
        icon: <Scissors className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.completeFinishing')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'PACKING') {
      return [{
        title: t('inventory.itemDetails.workflow.packing'),
        description: t('inventory.itemDetails.workflow.packingDesc'),
        icon: <Package className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.completePacking')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'SHIPPING') {
      return [{
        title: t('inventory.itemDetails.workflow.readyForShipment'),
        description: t('inventory.itemDetails.workflow.readyForShipmentDesc'),
        icon: <Truck className="h-5 w-5" />,
        status: 'current',
        action: (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => triggerScanner()}
          >
            {t('inventory.itemDetails.workflow.markAsShipped')}
          </Button>
        )
      }];
    }

    if (item.status2 === 'FULFILLED') {
      return [{
        title: t('inventory.itemDetails.workflow.fulfilled'),
        description: t('inventory.itemDetails.workflow.fulfilledOn', { 
          date: formatDateTime(item.updatedAt.toISOString()) 
        }),
        icon: <CheckCircle className="h-5 w-5" />,
        status: 'completed'
      }];
    }

    if (item.status2 === 'STORAGE_QUEUE') {
      // Check if we have a storage assignment in the scan events
      const storageAssignment = item.scanEvents.find(event => 
        event.type === 'STORAGE_ASSIGNMENT' && 
        event.success
      );

      if (storageAssignment) {
        return [{
          title: t('inventory.itemDetails.workflow.storeItem'),
          description: (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <p className="text-sm font-medium">{t('inventory.itemDetails.workflow.binAssigned')}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('inventory.itemDetails.workflow.systemConfirmed')}:</p>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t('inventory.itemDetails.workflow.binCode')}</p>
                    <p className="text-sm font-bold">{storageAssignment.metadata.binQrCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t('inventory.itemDetails.workflow.binName')}</p>
                    <p className="text-sm font-bold">{storageAssignment.metadata.binName}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t('inventory.itemDetails.workflow.capacity')}</p>
                      <p className="text-sm font-bold">{storageAssignment.metadata.capacity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t('inventory.itemDetails.workflow.available')}</p>
                      <p className="text-sm font-bold">{storageAssignment.metadata.available}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
          icon: <Box className="h-5 w-5" />,
          status: 'current',
          action: (
            <Button
              variant="ghost"
              size="sm"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => triggerScanner()}
            >
              {t('inventory.itemDetails.workflow.scanToConfirm', { bin: storageAssignment.metadata.binName })}
            </Button>
          )
        }];
      }

      return [{
        title: t('inventory.itemDetails.workflow.awaitingBin'),
        description: (
          <div className="space-y-4">
            <p>{t('inventory.itemDetails.workflow.assigningBin')}</p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">{t('inventory.itemDetails.workflow.checking')}:</p>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• {t('inventory.table.style')}: {item.style}</li>
                <li>• {t('inventory.table.wash')}: {item.wash}</li>
              </ul>
            </div>
          </div>
        ),
        icon: <Box className="h-5 w-5" />,
        status: 'current'
      }];
    }

    return [{
      title: t('inventory.itemDetails.workflow.noRequest'),
      description: t('inventory.itemDetails.workflow.noRequestDesc'),
      icon: <AlertCircle className="h-5 w-5" />,
      status: 'current'
    }];
  }, [item.status2, item.updatedAt, t]);

  useEffect(() => {
    setSteps(workflowSteps);
  }, [workflowSteps]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('inventory.itemDetails.workflow.title')}</h2>
        <div className="flex items-center gap-2">
          <Badge 
            variant={item.status1 === 'COMMITTED' ? 'default' : 'secondary'}
            className="uppercase"
          >
            {item.status1}
          </Badge>
          <Badge 
            variant="secondary"
            className="uppercase"
          >
            {item.status2}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {steps.length > 0 ? (
          steps.map((step, index) => (
            <div 
              key={step.title}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg transition-colors",
                step.status === 'current' ? 'bg-primary/10' : 'bg-muted/50'
              )}
            >
              <div className={cn(
                "p-2 rounded-full",
                step.status === 'completed' ? 'bg-green-500 text-white' :
                step.status === 'current' ? 'bg-primary text-white' :
                'bg-muted text-muted-foreground'
              )}>
                {step.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.action && (
                  <div className="mt-2">
                    {step.action}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-muted text-muted-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-medium">{t('inventory.itemDetails.workflow.noRequest')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('inventory.itemDetails.workflow.noRequestDesc')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function OrderCard({ order, status1 }: { order: OrderDetails | null, status1: string }) {
  const { t } = useTranslation();
  
  // Don't show order details if the item is only COMMITTED
  if (status1 === 'COMMITTED') {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('inventory.itemDetails.orderAssignment.title')}</h2>
          <Badge variant="secondary">WAITLISTED</Badge>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('inventory.itemDetails.orderAssignment.waitlistedDesc')}
        </p>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('inventory.itemDetails.orderAssignment.title')}</h2>
          <Badge variant="secondary">UNASSIGNED</Badge>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('inventory.itemDetails.orderAssignment.unassignedDesc')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t('inventory.itemDetails.orderAssignment.title')}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {order.priority}
          </Badge>
          <Badge variant="default" className="uppercase">
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('orders.table.orderId')}</p>
            <p className="text-sm font-medium mt-1">{order.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('orders.table.customer')}</p>
            <p className="text-sm font-medium mt-1">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('inventory.itemDetails.orderAssignment.orderDate')}</p>
            <p className="text-sm font-medium mt-1">
              {format(new Date(order.orderDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2">{t('inventory.itemDetails.orderAssignment.targetSku')}</p>
          <div className="grid grid-cols-5 gap-4 bg-muted/50 p-3 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('inventory.table.style')}</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.style}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('inventory.table.waist')}</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.waist}"</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('inventory.table.shape')}</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.shape}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('inventory.table.length')}</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.length}"</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t('inventory.table.wash')}</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.wash}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">{t('inventory.itemDetails.orderAssignment.finishingInstructions')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">{t('inventory.itemDetails.orderAssignment.hemType')}</p>
              <p className="text-sm text-muted-foreground">{order.hemType}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('inventory.itemDetails.orderAssignment.buttonColor')}</p>
              <p className="text-sm text-muted-foreground">{order.buttonColor}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t('inventory.itemDetails.orderAssignment.orderedOn', { date: format(new Date(order.orderDate), 'MMM d, yyyy') })}</span>
        </div>
      </div>
    </Card>
  );
}

export default function ItemDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('success');
  const [scanType, setScanType] = useState<string>('VERIFICATION');
  
  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/items/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch item details');
        }
        const data = await response.json();
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleScan = async (decodedText: string) => {
    if (!item) return;
    
    setScanning(true);
    try {
      // Verify the scanned QR code matches the item
      if (decodedText !== item.qrCode) {
        throw new Error('Scanned QR code does not match item');
      }

      // Determine scan type based on current state
      let scanType = 'ACTIVATION';
      if (item.status2 === 'STOCK') {
        scanType = 'MOVEMENT_SCAN';
      } else if (item.status2 === 'PRODUCTION') {
        scanType = 'ACTIVATION';
      } else {
        switch (item.status2) {
          case 'WASH_QUEUE':
            scanType = 'START_WASHING';
            break;
          case 'WASHING':
            scanType = 'COMPLETE_WASHING';
            break;
          case 'LAUNDRY':
            scanType = 'REACTIVATE_FROM_LAUNDRY';
            break;
          case 'QC':
            scanType = 'COMPLETE_QC';
            break;
          case 'FINISHING':
            scanType = 'COMPLETE_FINISHING';
            break;
          case 'PACKING':
            scanType = 'COMPLETE_PACKING';
            break;
          case 'SHIPPING':
            scanType = 'MARK_SHIPPED';
            break;
          default:
            scanType = 'ACTIVATION';
        }
      }

      console.log('[ITEM_DETAILS] Processing scan:', {
        itemId: item.id,
        qrCode: item.qrCode,
        currentStatus: item.status2,
        scanType
      });

      // Update the item's status
      const statusResponse = await fetch('/api/items/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          scanType
        }),
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error('[ITEM_DETAILS] Status update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update item status');
      }

      // Refresh the item details to get updated status and scan history
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) {
        throw new Error('Failed to refresh item details');
      }
      const data = await response.json();
      setItem(data);
      
      setShowScanner(false);
    } catch (err) {
      console.error('[ITEM_DETAILS] Scan error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to process scan',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  // Add manual activation function
  const handleManualActivation = async () => {
    if (!item) return;
    
    setScanning(true);
    try {
      // Always use ACTIVATION for manual activation
      const scanType = 'ACTIVATION';

      console.log('[ITEM_DETAILS] Processing manual activation:', {
        itemId: item.id,
        qrCode: item.qrCode,
        currentStatus: item.status2,
        scanType
      });

      // Update the item's status
      const statusResponse = await fetch('/api/items/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          scanType,
          location: 'STAGING'
        }),
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.error('[ITEM_DETAILS] Status update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update item status');
      }

      const statusData = await statusResponse.json();
      console.log('[ITEM_DETAILS] Status update response:', statusData);

      // Refresh the item details to get updated status and scan history
      const response = await fetch(`/api/items/${item.id}`);
      if (!response.ok) {
        throw new Error('Failed to refresh item details');
      }
      const data = await response.json();
      setItem(data);

      toast({
        title: 'Success',
        description: 'Item status has been updated successfully.',
      });

      // Force a page refresh to ensure all components update
      router.replace(router.asPath);
    } catch (err) {
      console.error('[ITEM_DETAILS] Manual activation error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update item status',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (error || !item) {
    return (
      <MobileLayout>
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold">{t('inventory.itemDetails.error.fetchFailed')}</h3>
              <p className="text-sm text-muted-foreground">{error || t('inventory.itemDetails.error.notFound')}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('inventory.itemDetails.title')}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={item.status1 === 'COMMITTED' ? 'success' : 'default'} className="uppercase">
              {item.status1}
            </Badge>
            <Badge variant="secondary" className="uppercase">
              {item.status2}
            </Badge>
          </div>
        </div>

        {/* Item Info */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{item.qrCode}</h2>
              <p className="text-sm text-muted-foreground">
                {t('inventory.itemDetails.created')} {format(new Date(item.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">{t('inventory.table.style')}</p>
              <p className="text-sm text-muted-foreground">{item.style}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('inventory.table.waist')}</p>
              <p className="text-sm text-muted-foreground">{item.waist}"</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('inventory.table.shape')}</p>
              <p className="text-sm text-muted-foreground">{item.shape}</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('inventory.table.length')}</p>
              <p className="text-sm text-muted-foreground">{item.length}"</p>
            </div>
            <div>
              <p className="text-sm font-medium">{t('inventory.table.wash')}</p>
              <p className="text-sm text-muted-foreground">{item.wash}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.location || '-'}</span>
          </div>
        </Card>

        {/* Workflow Card */}
        {item && <WorkflowCard 
          item={item} 
          router={router} 
          setShowScanner={setShowScanner}
          setScanType={setScanType}
          setScanning={setScanning}
        />}

        {/* QR Code */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold">{t('inventory.itemDetails.qrCode.title')}</h2>
          {showScanner ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                QR CODE - {scanType === 'MOVEMENT_SCAN' ? t('inventory.itemDetails.qrCode.move') : t('inventory.itemDetails.qrCode.verify')}
              </h3>
              <QrScanner
                onResult={handleScan}
                onError={(error) => {
                  console.error('[ITEM_DETAILS] Scan error:', error);
                  setScanning(false);
                  setShowScanner(false);
                }}
                mode={scanType}
                location={item?.location || undefined}
                className="w-full"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowScanner(false);
                  setScanning(false);
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={item.qrCode}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    setShowScanner(true);
                    setScanning(true);
                    setScanType('MOVEMENT_SCAN');
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t('inventory.itemDetails.qrCode.move')}
                </Button>
                <Button
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    setShowScanner(true);
                    setScanning(true);
                    setScanType('ACTIVATION');
                  }}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {t('inventory.itemDetails.qrCode.activate')}
                </Button>
                <Button
                  variant="default"
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    setShowScanner(true);
                    setScanning(true);
                    setScanType('DEFECT_SCAN');
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('inventory.itemDetails.qrCode.defect')}
                </Button>
                <Button
                  variant="default"
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={() => {
                    setShowScanner(true);
                    setScanning(true);
                    setScanType('LOOKUP');
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t('inventory.itemDetails.qrCode.lookup')}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Order Details */}
        {item && <OrderCard order={item.order} status1={item.status1} />}

        {/* Scan History */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Scan History</h2>
            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="space-y-4">
            {item.scanEvents.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No scan history available
              </div>
            ) : (
              <>
                <div className="flex space-x-2 border-b">
                  <button
                    onClick={() => setActiveTab('success')}
                    className={cn(
                      "pb-2 text-sm font-medium transition-colors relative",
                      activeTab === 'success' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                  >
                    Workflow Steps
                  </button>
                  <button
                    onClick={() => setActiveTab('failed')}
                    className={cn(
                      "pb-2 text-sm font-medium transition-colors relative",
                      activeTab === 'failed' ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                    )}
                  >
                    Failed Attempts
                  </button>
                </div>

                <div className="space-y-3">
                  {activeTab === 'success' ? (
                    item.scanEvents.filter(scan => scan.success).length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No successful scans yet
                      </div>
                    ) : (
                      item.scanEvents
                        .filter(scan => scan.success)
                        .map((scan) => (
                          <div
                            key={scan.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <div className="mt-0.5">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {scan.type}
                                </p>
                                <time className="text-xs text-muted-foreground">
                                  {format(new Date(scan.timestamp), 'MMM d, h:mm a')}
                                </time>
                              </div>
                              {scan.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {scan.location}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    )
                  ) : (
                    item.scanEvents.filter(scan => !scan.success).length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No failed attempts
                      </div>
                    ) : (
                      item.scanEvents
                        .filter(scan => !scan.success)
                        .map((scan) => (
                          <div
                            key={scan.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10"
                          >
                            <div className="mt-0.5">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {scan.type}
                                </p>
                                <time className="text-xs text-muted-foreground">
                                  {format(new Date(scan.timestamp), 'MMM d, h:mm a')}
                                </time>
                              </div>
                              {scan.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {scan.location}
                                </div>
                              )}
                              {scan.metadata?.error && (
                                <p className="text-xs text-destructive">
                                  Error: {scan.metadata.error}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Add manual activation and move simulation buttons */}
        {item && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!item) return;
                setScanning(true);
                try {
                  // Find the latest storage assignment event
                  const storageAssignment = item.scanEvents.find(event => 
                    event.type === 'STORAGE_ASSIGNMENT' && 
                    event.success
                  );

                  if (!storageAssignment) {
                    throw new Error('No storage bin assignment found');
                  }

                  // Simulate a successful move by calling the status API with MOVEMENT_SCAN
                  const statusResponse = await fetch('/api/items/status', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      itemId: item.id,
                      scanType: 'BIN_CONFIRMATION',
                      binQrCode: storageAssignment.metadata.binQrCode,
                      location: storageAssignment.metadata.binName,
                      success: true,
                      metadata: {
                        binQrCode: storageAssignment.metadata.binQrCode,
                        binName: storageAssignment.metadata.binName,
                        movementComplete: true,
                        destinationBinId: storageAssignment.metadata.binId
                      }
                    }),
                  });

                  if (!statusResponse.ok) {
                    const errorData = await statusResponse.json();
                    throw new Error(errorData.error || 'Failed to simulate move');
                  }

                  // Refresh the item details
                  const response = await fetch(`/api/items/${item.id}`);
                  if (!response.ok) {
                    throw new Error('Failed to refresh item details');
                  }
                  const data = await response.json();
                  setItem(data);

                  toast({
                    title: 'Success',
                    description: 'Move simulated successfully',
                  });

                  // Force a page refresh to ensure all components update
                  router.replace(router.asPath);
                } catch (err) {
                  console.error('[ITEM_DETAILS] Move simulation error:', err);
                  toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Failed to simulate move',
                    variant: 'destructive',
                  });
                } finally {
                  setScanning(false);
                }
              }}
              disabled={scanning || item.status2 === 'FULFILLED' || !item.scanEvents.some(event => event.type === 'STORAGE_ASSIGNMENT' && event.success)}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Simulate Move'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualActivation}
              disabled={scanning || item.status2 === 'FULFILLED'}
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
} 