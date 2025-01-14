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
  Loader2,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Item {
  id: string;
  status1: string;
  status2: string;
  style: string;
  waist: number;
  length: number;
  shape: string;
  wash: string;
}

interface Order {
  id: string;
  createdAt: string;
  status1: string;
  status2: string;
  targetStyle: string;
  targetWaist: number;
  targetLength: number;
  targetShape: string;
  targetWash: string;
  buttonColor: string;
  hemType: string;
  items: Item[];
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  orders: Order[];
}

function formatDateTime(dateString: string) {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a');
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'in_progress':
      return <Badge variant="default">In Progress</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'created':
      return <Badge variant="secondary">Created</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function OrderTable({ orders, title }: { orders: Order[], title: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          {title}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.orderId')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.date')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.stage')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.sku')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('orders.table.items')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr 
                key={order.id}
                className={cn(
                  'border-b',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                )}
              >
                <td className="px-4 py-3">
                  <Link 
                    href={`/orders/${order.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {order.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(order.status1)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(order.status2)}
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {`${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`}
                </td>
                <td className="px-4 py-3 text-sm">
                  {order.items.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch customer details');
        }
        const data = await response.json();
        setCustomer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
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

  if (error || !customer) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center">
            <h3 className="font-semibold">{t('customers.error.fetchFailed')}</h3>
            <p className="text-sm text-muted-foreground">{error || t('customers.error.notFound')}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/customers')}
          >
            {t('common.back')}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const activeOrders = customer.orders.filter(
    order => !['completed', 'cancelled'].includes(order.status1.toLowerCase())
  );
  
  const pastOrders = customer.orders.filter(
    order => ['completed', 'cancelled'].includes(order.status1.toLowerCase())
  );

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">
              {t('customers.details.customerSince')} {formatDateTime(customer.createdAt)}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/customers')}
          >
            {t('common.back')}
          </Button>
        </div>

        {/* Customer Information */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('customers.details.contactInfo')}
          </h2>
          
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <div className="text-sm text-muted-foreground">{t('customers.table.email')}</div>
                <div className="font-medium">{customer.email}</div>
              </div>
            </div>
            
            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('customers.table.phone')}</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
              </div>
            )}
            
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('customers.table.address')}</div>
                  <div className="font-medium">{customer.address}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <OrderTable orders={activeOrders} title={t('customers.details.activeOrders')} />
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <OrderTable orders={pastOrders} title={t('customers.details.orderHistory')} />
        )}
      </div>
    </MobileLayout>
  );
} 