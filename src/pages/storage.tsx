import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  Box,
  QrCode,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

// Types for storage bins
interface StorageBin {
  id: string;
  qrCode: string;
  type: string;
  name: string;
  status: string;
  currentCount: number;
  capacity: number;
  zone: string;
  rack: string;
  shelf: string;
  binNumber: string;
  Item: Array<{
    id: string;
    qrCode: string;
    style: string;
    waist: number;
    length: number;
    shape: string;
    wash: string;
    status1: string;
    status2: string;
    createdAt: string;
  }>;
}

interface StorageBins {
  [zone: string]: StorageBin[];
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

interface BinDetailsProps {
  bin: StorageBin;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function BinDetails({ bin, onClose, onDelete, onEdit }: BinDetailsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil((bin.Item?.length || 0) / itemsPerPage);
  const { t } = useTranslation();
  
  const paginatedItems = (bin.Item || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bin.name}</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t('storage.details.zone')}: {bin.zone}</p>
            <p>{t('storage.details.type')}: {bin.type}</p>
            <p>{t('storage.details.capacity')}: {bin.currentCount}/{bin.capacity}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t('common.delete')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.itemId')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.sku')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.status1')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.status2')}</th>
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
                  <td className="px-4 py-3">{`${item.style}-${item.waist}-${item.length}-${item.shape}-${item.wash}`}</td>
                  <td className="px-4 py-3">{item.status1}</td>
                  <td className="px-4 py-3">{item.status2}</td>
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
            {t('common.previous')}
          </Button>
          <div className="text-sm text-muted-foreground">
            {t('storage.details.page', { current: currentPage, total: totalPages })}
          </div>
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            {t('common.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface BinListProps {
  bins: StorageBin[];
  onViewDetails: (bin: StorageBin) => void;
}

function BinList({ bins, onViewDetails }: BinListProps) {
  const { t } = useTranslation();
  
  // Ensure bins is an array, if not, return empty table
  if (!Array.isArray(bins)) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.binName')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.capacity')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.type')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground">
                  {t('storage.noBins')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.binName')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.capacity')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.type')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('storage.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((bin, index) => (
              <tr 
                key={bin.id}
                className={cn(
                  'border-b',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                )}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{bin.name}</div>
                </td>
                <td className="px-4 py-3">
                  {bin.currentCount}/{bin.capacity}
                </td>
                <td className="px-4 py-3">{bin.type}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onViewDetails(bin)}
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {t('storage.details.viewDetails')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NewBinFormData {
  capacity: '10' | '25' | '50';
  zone: string;
  rack?: string;
  shelf?: string;
  binSku?: string;
}

export default function Storage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedBin, setSelectedBin] = useState<StorageBin | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewBinOpen, setIsNewBinOpen] = useState(false);
  const [formData, setFormData] = useState<NewBinFormData>({
    capacity: '25',
    zone: ''
  });
  const [storageBins, setStorageBins] = useState<StorageBins>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorageBins = async () => {
      try {
        const response = await fetch('/api/storage');
        if (!response.ok) {
          throw new Error(t('storage.messages.fetchError'));
        }
        const data = await response.json();
        setStorageBins(data);
      } catch (error) {
        console.error('Error fetching storage bins:', error);
        toast({
          title: t('common.error'),
          description: t('storage.messages.fetchError'),
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageBins();
  }, [toast, t]);

  const generateBinSku = (zone: string, capacity: string) => {
    return `${zone}-${capacity}`;
  };

  const findNextAvailableLocation = (zone: string, bins: StorageBin[]) => {
    const existingLocations = new Set(
      bins
        .filter(bin => bin.zone === zone)
        .map(bin => `${bin.rack}-${bin.shelf}-${bin.binNumber}`)
    );

    // Each zone has 10 racks with 5 shelves each
    for (let rack = 1; rack <= 10; rack++) {
      for (let shelf = 1; shelf <= 5; shelf++) {
        // Find the next available bin number for this rack and shelf
        let binNumber = 1;
        while (existingLocations.has(`${rack}-${shelf}-${binNumber}`)) {
          binNumber++;
        }
        
        // Found an available location
        return {
          rack: rack.toString(),
          shelf: shelf.toString(),
          binNumber: binNumber.toString()
        };
      }
    }

    // If we get here, all locations are taken
    throw new Error('No available locations in this zone');
  };

  const handleCapacitySelect = (capacity: '10' | '25' | '50') => {
    setFormData(prev => ({
      ...prev,
      capacity,
      binSku: generateBinSku(prev.zone, capacity)
    }));
  };

  const handleZoneSelect = (zone: string) => {
    setFormData(prev => ({
      ...prev,
      zone,
      binSku: generateBinSku(zone, prev.capacity)
    }));
  };

  const handleCreateBin = async () => {
    try {
      // Find next available location
      const zoneBins = storageBins[formData.zone] || [];
      const location = findNextAvailableLocation(formData.zone, zoneBins);

      // Generate the bin name
      const binName = `${formData.zone}-R${location.rack}-S${location.shelf}-B${location.binNumber}`;
      const qrCode = `${binName}-${formData.capacity}`;

      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: formData.zone,
          capacity: parseInt(formData.capacity),
          name: binName,
          qrCode: qrCode,
          status: 'ACTIVE',
          currentCount: 0,
          zone: formData.zone,
          rack: location.rack,
          shelf: location.shelf,
          binNumber: location.binNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('storage.messages.createError'));
      }

      const newBin = await response.json();
      setStorageBins(prev => {
        const zone = newBin.type.toUpperCase();
        return {
          ...prev,
          [zone]: [...(prev[zone] || []), {
            id: newBin.id,
            qrCode: newBin.qrCode,
            name: newBin.name,
            zone: newBin.type,
            currentCount: 0,
            capacity: parseInt(newBin.capacity),
            type: newBin.type,
            status: 'ACTIVE',
            rack: location.rack,
            shelf: location.shelf,
            binNumber: location.binNumber,
            Item: []
          }]
        };
      });

      setIsNewBinOpen(false);
      toast({
        title: t('common.success'),
        description: t('storage.messages.createSuccess'),
      });
    } catch (error) {
      console.error('Error creating storage bin:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('storage.messages.createError'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBin = async () => {
    if (!selectedBin) return;

    try {
      const response = await fetch(`/api/storage/${selectedBin.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(t('storage.messages.deleteError'));
      }

      setStorageBins(prev => {
        const zone = selectedBin.zone.toUpperCase();
        return {
          ...prev,
          [zone]: prev[zone].filter(bin => bin.id !== selectedBin.id)
        };
      });

      setIsDetailsOpen(false);
      toast({
        title: t('common.success'),
        description: t('storage.messages.deleteSuccess'),
      });
    } catch (error) {
      console.error('Error deleting storage bin:', error);
      toast({
        title: t('common.error'),
        description: t('storage.messages.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const handleEditBin = () => {
    // TODO: Implement edit functionality
    setIsDetailsOpen(false);
  };

  return (
    <MobileLayout>
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('storage.title')}</h1>
          <Button onClick={() => setIsNewBinOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('storage.newBin')}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t('storage.loading')}</div>
        ) : (
          <Tabs defaultValue={Object.keys(storageBins)[0] || 'ZONE1'} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              {Object.keys(storageBins).map((zone) => (
                <TabsTrigger key={zone} value={zone} className="text-sm">
                  {zone}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(storageBins).map(([zone, bins]) => (
              <TabsContent key={zone} value={zone}>
                <BinList
                  bins={Array.isArray(bins) ? bins : []}
                  onViewDetails={(bin) => {
                    setSelectedBin(bin);
                    setIsDetailsOpen(true);
                  }}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <Dialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        >
          {selectedBin && (
            <BinDetails
              bin={selectedBin}
              onClose={() => setIsDetailsOpen(false)}
              onDelete={handleDeleteBin}
              onEdit={handleEditBin}
            />
          )}
        </Dialog>

        <Dialog
          open={isNewBinOpen}
          onOpenChange={setIsNewBinOpen}
        >
          <div className="space-y-6 p-6">
            <h3 className="text-lg font-semibold">{t('storage.newBinDialog.title')}</h3>
            
            {/* Zone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('storage.newBinDialog.zone')}</label>
              <div className="grid grid-cols-2 gap-2">
                {['ZONE1', 'ZONE2', 'ZONE3', 'ZONE4'].map((zone) => (
                  <Button
                    key={zone}
                    variant={formData.zone === zone ? "default" : "outline"}
                    className={cn(
                      "h-20 flex flex-col items-center justify-center gap-2",
                      formData.zone === zone && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleZoneSelect(zone)}
                  >
                    <MapPin className="h-6 w-6" />
                    {zone}
                  </Button>
                ))}
              </div>
            </div>

            {/* Capacity Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('storage.newBinDialog.capacity')}</label>
              <div className="grid grid-cols-3 gap-2">
                {['10', '25', '50'].map((cap) => (
                  <Button
                    key={cap}
                    variant={formData.capacity === cap ? "default" : "outline"}
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      formData.capacity === cap && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleCapacitySelect(cap as '10' | '25' | '50')}
                  >
                    <Box className="h-6 w-6" />
                    {cap} {t('storage.newBinDialog.units')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {formData.zone && formData.capacity && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('storage.newBinDialog.preview')}</label>
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('storage.newBinDialog.binSku')}</p>
                      <p className="text-2xl font-bold">{formData.binSku || generateBinSku(formData.zone, formData.capacity)}</p>
                    </div>
                    <QrCode className="h-8 w-8 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('storage.newBinDialog.zone')}</p>
                      <p className="text-lg font-semibold">{formData.zone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('storage.newBinDialog.capacity')}</p>
                      <p className="text-lg font-semibold">{formData.capacity} {t('storage.newBinDialog.units')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">{t('storage.newBinDialog.locationAssignment')}</p>
                    <div className="grid grid-cols-3 gap-4">
                      {(() => {
                        // Get next available location
                        const zoneBins = storageBins[formData.zone] || [];
                        try {
                          const location = findNextAvailableLocation(formData.zone, zoneBins);
                          return (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground">{t('storage.newBinDialog.rack')}</p>
                                <p className="text-lg font-semibold">{location.rack}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{t('storage.newBinDialog.shelf')}</p>
                                <p className="text-lg font-semibold">{location.shelf}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{t('storage.newBinDialog.bin')}</p>
                                <p className="text-lg font-semibold">{location.binNumber}</p>
                              </div>
                            </>
                          );
                        } catch (error) {
                          return (
                            <div className="col-span-3 flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="text-sm font-medium">{t('storage.newBinDialog.noLocations')}</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewBinOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleCreateBin}
                disabled={!formData.zone || !formData.capacity}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('storage.newBinDialog.createBin')}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </MobileLayout>
  );
} 