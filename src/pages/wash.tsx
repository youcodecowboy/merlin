import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Droplets, 
  QrCode, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Timer,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

interface WashBin {
  id: string;
  name: string;
  description: string;
  type: string;
  zone: string;
  capacity: number;
  currentCount: number;
  assignedItems: Array<{
    id: string;
    sku: string;
    status1: string;
    status2: string;
    createdAt: string;
  }>;
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

interface WashBinTableProps {
  bin: WashBin;
  onScanOut: () => void;
}

function WashBinTable({ bin, onScanOut }: WashBinTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(bin.assignedItems.length / itemsPerPage);
  
  const paginatedItems = bin.assignedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bin.name}</h3>
          <p className="text-sm text-muted-foreground">{bin.description}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, bin.assignedItems.length)} of {bin.assignedItems.length} items
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={onScanOut}
          className="flex items-center gap-2"
        >
          <QrCode className="h-4 w-4" />
          Scan Out Bin
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS1</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS2</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, index) => (
                <tr 
                  key={item.id}
                  className={cn(
                    'border-b',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                  )}
                >
                  <td className="px-4 py-3">
                    <Link 
                      href={`/items/${item.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3">{item.status1}</td>
                  <td className="px-4 py-3">{item.status2}</td>
                  <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface LaundryItem {
  id: string;
  style: string;
  status1: string;
  status2: string;
  createdAt: string;
}

function LaundryTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchLaundryItems = async () => {
      try {
        const response = await fetch('/api/wash/laundry');
        if (!response.ok) throw new Error('Failed to fetch laundry items');
        const data = await response.json();
        setLaundryItems(data.items);
      } catch (error) {
        console.error('Error fetching laundry items:', error);
        toast.error('Failed to load laundry items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaundryItems();
  }, []);

  const totalPages = Math.ceil(laundryItems.length / itemsPerPage);
  const paginatedItems = laundryItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Laundry Items</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, laundryItems.length)} of {laundryItems.length} items
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS1</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS2</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, index) => (
                <tr 
                  key={item.id}
                  className={cn(
                    'border-b',
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                  )}
                >
                  <td className="px-4 py-3">
                    <Link 
                      href={`/items/${item.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.style}</td>
                  <td className="px-4 py-3">{item.status1}</td>
                  <td className="px-4 py-3">{item.status2}</td>
                  <td className="px-4 py-3">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Wash() {
  const [isLoading, setIsLoading] = useState(true);
  const [washBins, setWashBins] = useState<WashBin[]>([]);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [scanOutBin, setScanOutBin] = useState<string | null>(null);

  useEffect(() => {
    // Fetch wash bins on component mount
    const fetchWashBins = async () => {
      try {
        const response = await fetch('/api/wash/bins');
        if (!response.ok) throw new Error('Failed to fetch wash bins');
        const data = await response.json();
        setWashBins(data.bins);
        if (data.bins.length > 0) {
          setSelectedBin(data.bins[0].id);
        }
      } catch (error) {
        console.error('Error fetching wash bins:', error);
        toast.error('Failed to load wash bins');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWashBins();
  }, []);

  const handleScanOut = (binId: string) => {
    setScanOutBin(binId);
  };

  const handleConfirmScanOut = async () => {
    if (!scanOutBin) return;

    try {
      const response = await fetch(`/api/wash/bins/${scanOutBin}/scan-out`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to scan out bin');

      toast.success('Bin scanned out successfully');
      setScanOutBin(null);

      // Refresh bin data
      const updatedBinsResponse = await fetch('/api/wash/bins');
      if (!updatedBinsResponse.ok) throw new Error('Failed to refresh bin data');
      const data = await updatedBinsResponse.json();
      setWashBins(data.bins);

    } catch (error) {
      console.error('Error scanning out bin:', error);
      toast.error('Failed to scan out bin');
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Wash</h1>
          <Droplets className="h-6 w-6 text-muted-foreground" />
        </div>

        <Tabs defaultValue="bins" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="bins" className="flex-1">
              <Droplets className="h-4 w-4 mr-2" />
              Wash Bins
            </TabsTrigger>
            <TabsTrigger value="laundry" className="flex-1">
              <Timer className="h-4 w-4 mr-2" />
              Laundry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bins">
            <div className="space-y-6">
              <Tabs value={selectedBin || ''} className="w-full" onValueChange={setSelectedBin}>
                <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {washBins.map((bin) => (
                    <TabsTrigger key={bin.id} value={bin.id} className="flex-1">
                      {bin.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {washBins.map((bin) => (
                  <TabsContent key={bin.id} value={bin.id}>
                    <WashBinTable
                      bin={bin}
                      onScanOut={() => handleScanOut(bin.id)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="laundry" className="space-y-4">
            <LaundryTable />
          </TabsContent>
        </Tabs>
      </div>

      {/* Scan Out Confirmation Modal */}
      <Dialog
        open={!!scanOutBin}
        onOpenChange={() => setScanOutBin(null)}
      >
        <Dialog.Title>Confirm Scan Out</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to scan out this wash bin? This action will update the status of all items in the bin.
        </Dialog.Description>

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              Make sure all items in the bin have completed the wash process before scanning out.
            </div>
          </div>
        </div>

        <Dialog.Footer>
          <Button
            variant="ghost"
            onClick={() => setScanOutBin(null)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmScanOut}
          >
            Confirm Scan Out
          </Button>
        </Dialog.Footer>
      </Dialog>
    </MobileLayout>
  );
} 