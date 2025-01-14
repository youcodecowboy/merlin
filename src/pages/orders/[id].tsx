import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Timer,
  Truck,
  PackageCheck,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OrderDetails {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
  };
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    sku: string;
    status: string;
    stage: string | null;
  }>;
  targetSku: {
    style: string;
    waist: number;
    shape: string;
    length: number;
    wash: string;
  };
  buttonColor: string;
  hemType: string;
  waitlist: Array<{
    id: string;
    position: number;
    productionRequest: {
      id: string;
      sku: string;
      quantity: number;
      status: string;
    };
  }>;
}

function formatDateTime(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
}

function getStatusBadge(status: string | undefined) {
  if (!status) return <Badge>Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="default">In Progress</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'waitlisted':
      return <Badge variant="secondary">Waitlisted</Badge>;
    case 'assigned':
      return <Badge variant="default">Assigned</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  if (error || !order) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <h3 className="font-semibold">Error Loading Order</h3>
            <p className="text-sm text-muted-foreground">{error || 'Order not found'}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/orders')}
          >
            Return to Orders
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              Created {formatDateTime(order.createdAt)}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Customer Information */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Information
          </h2>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <div className="font-medium">{order.customer.name}</div>
              </div>
            </div>
            
            {order.customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="font-medium">{order.customer.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Target SKU */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Target SKU
          </h2>
          
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Style</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.style}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Waist</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.waist}"</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Shape</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.shape}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Length</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.length}"</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Wash</p>
              <p className="text-sm font-bold mt-1">{order.targetSku.wash}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Button Color</p>
              <p className="text-sm font-medium mt-1">{order.buttonColor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Hem Type</p>
              <p className="text-sm font-medium mt-1">{order.hemType}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STAGE</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr 
                    key={item.id}
                    className={cn(
                      'border-b',
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                    )}
                  >
                    <td className="px-4 py-3">
                      <Button
                        variant="link"
                        className="h-auto p-0 font-medium"
                        asChild
                      >
                        <a href={`/items/${item.id}`}>{item.id}</a>
                      </Button>
                    </td>
                    <td className="px-4 py-3">{item.sku}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.stage || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waitlist */}
        {order.waitlist.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Production Waitlist
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">POSITION</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">REQUEST ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">QUANTITY</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {order.waitlist.map((entry, index) => (
                    <tr 
                      key={entry.id}
                      className={cn(
                        'border-b',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{entry.position}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium"
                          asChild
                        >
                          <a href={`/production/${entry.productionRequest.id}`}>{entry.productionRequest.id}</a>
                        </Button>
                      </td>
                      <td className="px-4 py-3">{entry.productionRequest.sku}</td>
                      <td className="px-4 py-3">{entry.productionRequest.quantity}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(entry.productionRequest.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
} 