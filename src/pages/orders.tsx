import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  ClipboardList,
  Plus,
  UserPlus,
  Package,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  customer: Customer;
  status: string;
  createdAt: string;
  targetStyle: string;
  targetWaist: number;
  targetShape: string;
  targetLength: number;
  targetWash: string;
  buttonColor: string;
  hemType: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'COMPLETED', label: 'Completed' }
];

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>;
    case 'ASSIGNED':
      return <Badge variant="secondary">Assigned</Badge>;
    case 'IN_PRODUCTION':
      return <Badge variant="default">In Production</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  const formatSKU = () => {
    return `${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`;
  };

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="font-medium">{order.customer.name}</div>
        <div className="text-sm text-muted-foreground">{order.customer.email}</div>
      </td>
      <td className="px-4 py-3">
        <Link 
          href={`/orders/${order.id}`}
          className="font-medium text-primary hover:underline"
        >
          {order.id}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{formatSKU()}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {getStatusBadge(order.status)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDateTime(order.createdAt)}
      </td>
    </tr>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      `${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || order.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const STATUS_OPTIONS = [
    { value: 'all', label: t('orders.status.all') },
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'inProgress', label: t('orders.status.inProgress') },
    { value: 'completed', label: t('orders.status.completed') },
    { value: 'cancelled', label: t('orders.status.cancelled') }
  ];

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
          <Button onClick={() => router.push('/orders/new')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('orders.newOrder')}
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('orders.searchPlaceholder')}
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 font-medium">{t('orders.table.customer')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.table.orderId')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.table.sku')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.table.status')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('orders.table.date')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('orders.loading')}
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('orders.noOrders')}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <OrderRow key={order.id} order={order} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
} 