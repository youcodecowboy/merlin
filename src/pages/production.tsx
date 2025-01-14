import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Factory,
  ChevronRight,
  Clock,
  Package,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Timer,
  AlertCircle,
  Loader2,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ProductionRequest, WaitlistedOrder, ActiveProduction } from '@/types/production';

interface WaitlistViewProps {
  orders: WaitlistedOrder[];
  onViewAll?: () => void;
  isExpanded?: boolean;
}

function WaitlistView({ orders, onViewAll, isExpanded = false }: WaitlistViewProps) {
  const displayOrders = isExpanded ? orders : orders.slice(0, 3);
  const hasMore = orders.length > 3 && !isExpanded;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Orders Waitlisted ({orders.length})
      </div>
      <div className="space-y-1">
        {displayOrders.map((order) => (
          <div
            key={order.orderId}
            className="rounded-lg border bg-card px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="grid grid-cols-5 gap-2 items-center text-sm">
              <div>
                <Link 
                  href={`/orders/${order.orderId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {order.orderId}
                </Link>
              </div>
              <div className="truncate">{order.customerName}</div>
              <div>{order.quantity} units</div>
              <div>{new Date(order.orderDate).toLocaleDateString()}</div>
              <div className="flex justify-end">
                <Badge variant={
                  order.priority === 'high' ? 'danger' :
                  order.priority === 'medium' ? 'warning' : 'success'
                }>
                  {order.priority}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          className="w-full text-primary"
          onClick={onViewAll}
        >
          View All Orders <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface ExpandedViewProps {
  request: ProductionRequest;
  onClose: () => void;
}

interface ModificationForm {
  newQuantity: number;
  newInseam: number;
}

function ExpandedView({ request, onClose }: ExpandedViewProps) {
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const { toast } = useToast();

  const handleAcceptRequest = async () => {
    try {
      const response = await fetch('/api/production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          action: 'accept'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept production request');
      }

      toast({
        title: 'Success',
        description: data.message || 'Production request accepted',
      });

      // Close the expanded view and refresh the page
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error accepting production request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept production request',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog.Title>Production Request Details</Dialog.Title>
      <Dialog.Description>
        View details and waitlisted orders for {request.style}-{request.waist}-{request.shape}-{request.length}-{request.wash}
      </Dialog.Description>

      <div className="mt-6 space-y-6">
        {/* Request Details */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Request Details</h3>
            <Badge variant={
              request.daysSinceCreated > 7 ? 'danger' :
              request.daysSinceCreated > 3 ? 'warning' : 'success'
            }>
              {request.daysSinceCreated} days old
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Request ID</div>
              <div className="font-medium">{request.id}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Style</div>
              <div className="font-medium">{request.style}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Waist</div>
              <div className="font-medium">{request.waist}"</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Length</div>
              <div className="font-medium">{request.length}"</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Shape</div>
              <div className="font-medium">{request.shape}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Wash</div>
              <div className="font-medium">{request.wash}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Quantity</div>
              <div className="font-medium">{request.quantity} units</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Requested Date</div>
              <div className="font-medium">
                {new Date(request.requestedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Waitlisted Orders */}
        <div className="rounded-lg border bg-card p-4">
          <WaitlistView 
            orders={request.waitlistedOrders}
            isExpanded={true}
          />
        </div>
      </div>

      <Dialog.Footer className="flex-col sm:flex-row gap-2">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="default"
            className="flex-1 sm:flex-none"
            onClick={handleAcceptRequest}
          >
            Accept Request
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() => setShowModifyDialog(true)}
          >
            Modify Request
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
        >
          Close
        </Button>
      </Dialog.Footer>

      {/* Modification Dialog */}
      <Dialog
        open={showModifyDialog}
        onOpenChange={setShowModifyDialog}
      >
        <ModificationDialog request={request} onClose={() => setShowModifyDialog(false)} />
      </Dialog>
    </>
  );
}

interface ModificationDialogProps {
  request: ProductionRequest;
  onClose: () => void;
}

function ModificationDialog({ request, onClose }: ModificationDialogProps) {
  // Calculate minimum allowed length from waitlist
  const minAllowedLength = Math.max(
    ...request.waitlistedOrders.map(order => order.targetSku.length)
  );

  const [form, setForm] = useState<ModificationForm>({
    newQuantity: request.quantity,
    newInseam: request.length
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Validate length
    if (form.newInseam < minAllowedLength) {
      setError(`Length cannot be shorter than ${minAllowedLength} due to waitlist requirements`);
      return;
    }

    // Validate quantity
    if (form.newQuantity <= request.quantity) {
      setError('New quantity must be greater than current quantity');
      return;
    }

    // Handle the modification
    console.log('Modifying request:', {
      requestId: request.id,
      newQuantity: form.newQuantity,
      newInseam: form.newInseam
    });

    onClose();
  };

  return (
    <>
      <Dialog.Title>Modify Production Request</Dialog.Title>
      <Dialog.Description>
        Modify the quantity or inseam length for this production request.
      </Dialog.Description>

      <div className="space-y-4 my-6">
        {/* Current Details */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="text-sm font-medium">Current Details</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Quantity</div>
              <div>{request.quantity} units</div>
            </div>
            <div>
              <div className="text-muted-foreground">Inseam</div>
              <div>{request.length}"</div>
            </div>
          </div>
        </div>

        {/* Modification Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">New Quantity</label>
            <Input
              type="number"
              min={request.quantity + 1}
              value={form.newQuantity}
              onChange={(e) => setForm(prev => ({
                ...prev,
                newQuantity: parseInt(e.target.value)
              }))}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Must be greater than current quantity
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">New Inseam Length</label>
            <Input
              type="number"
              min={minAllowedLength}
              value={form.newInseam}
              onChange={(e) => setForm(prev => ({
                ...prev,
                newInseam: parseInt(e.target.value)
              }))}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Minimum allowed length: {minAllowedLength}"
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}
      </div>

      <Dialog.Footer>
        <Button
          variant="ghost"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </Dialog.Footer>
    </>
  );
}

export default function Production() {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productionRequests, setProductionRequests] = useState<ProductionRequest[]>([]);
  const [activeProduction, setActiveProduction] = useState<ActiveProduction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[PRODUCTION] Fetching production data...');
        const response = await fetch('/api/production');
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[PRODUCTION] Error response:', errorText);
          throw new Error(`Failed to fetch production requests: ${errorText}`);
        }
        const data = await response.json();
        console.log('[PRODUCTION] Received data:', data);
        
        // Split the requests into pending and active
        const pending = data.filter((req: ProductionRequest) => req.status === 'PENDING');
        const active = data.filter((req: ProductionRequest) => req.status === 'IN_PROGRESS').map((req: ProductionRequest) => ({
          ...req,
          completedQuantity: 0, // Default value since we don't track this yet
          startTime: req.requestedDate, // Use requestedDate as startTime
          estimatedCompletion: new Date(new Date(req.requestedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // Estimate 7 days from start
        }));
        console.log('[PRODUCTION] Pending requests:', pending);
        console.log('[PRODUCTION] Active requests:', active);
        
        setProductionRequests(pending);
        setActiveProduction(active);
      } catch (err) {
        console.error('[PRODUCTION] Error fetching production data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <h3 className="font-semibold">Error Loading Production Data</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Production</h1>
          <Factory className="h-6 w-6 text-muted-foreground" />
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="requests" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Production Requests
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              <Factory className="h-4 w-4 mr-2" />
              Active Production
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {productionRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{request.style}-{request.waist}-{request.shape}-{request.length}-{request.wash}</h3>
                    </div>
                    <Badge variant={
                      request.daysSinceCreated > 7 ? 'danger' :
                      request.daysSinceCreated > 3 ? 'warning' : 'success'
                    }>
                      {request.daysSinceCreated} days old
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium">{request.quantity} units</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Requested</div>
                      <div className="font-medium">
                        {new Date(request.requestedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <WaitlistView 
                    orders={request.waitlistedOrders}
                    onViewAll={() => setExpandedRequest(request.id)}
                  />

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            console.log('[PRODUCTION] Accepting request:', request.id);
                            const response = await fetch('/api/production', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                requestId: request.id,
                                action: 'accept'
                              }),
                            });

                            let data;
                            try {
                              const text = await response.text();
                              console.log('[PRODUCTION] Raw response:', text);
                              data = text ? JSON.parse(text) : null;
                            } catch (parseError) {
                              console.error('[PRODUCTION] Error parsing response:', parseError);
                              throw new Error('Failed to parse server response');
                            }
                            
                            if (!response.ok || !data) {
                              console.error('[PRODUCTION] Server error:', data);
                              throw new Error(data?.error || 'Failed to accept production request');
                            }

                            console.log('[PRODUCTION] Request accepted:', data);
                            toast({
                              title: 'Success',
                              description: data.message || 'Production request accepted',
                            });

                            // Refresh the page to show updated state
                            window.location.reload();
                          } catch (error) {
                            console.error('[PRODUCTION] Error accepting production request:', error);
                            toast({
                              title: 'Error',
                              description: error instanceof Error ? error.message : 'Failed to accept production request',
                              variant: 'destructive',
                            });
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setExpandedRequest(request.id);
                        }}
                      >
                        Modify
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedRequest(request.id)}
                    >
                      Expand View <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeProduction.map((production) => (
              <div
                key={production.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{production.style}-{production.waist}-{production.shape}-{production.length}-{production.wash}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {production.completedQuantity}/{production.quantity} units
                    </Badge>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Log the batch ID
                        console.log('[PRODUCTION] Printing QR codes for batch:', production.id);
                        // Download QR codes PDF
                        window.open(`/api/production/batch-qr?requestId=${encodeURIComponent(production.id)}`, '_blank');
                      }}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Started</div>
                      <div className="font-medium">
                        {new Date(production.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Est. Completion</div>
                      <div className="font-medium">
                        {new Date(production.estimatedCompletion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <WaitlistView 
                    orders={production.waitlistedOrders}
                    onViewAll={() => {
                      // Handle view all for active production
                      console.log('View all orders for:', production.id);
                    }}
                  />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Expanded View Dialog */}
      <Dialog
        open={!!expandedRequest}
        onOpenChange={(open) => {
          if (!open) setExpandedRequest(null);
        }}
      >
        {expandedRequest && (
          <ExpandedView
            request={productionRequests.find(req => req.id === expandedRequest)!}
            onClose={() => setExpandedRequest(null)}
          />
        )}
      </Dialog>
    </MobileLayout>
  );
} 