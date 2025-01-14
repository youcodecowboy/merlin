import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Order {
  id: string;
  createdAt: string;
  status1: string;
  status2: string;
  targetSku: string;
  items: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  totalOrders: number;
  orders: Order[];
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

function Row({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <tr className="border-b">
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </td>
        <td className="px-4 py-3">
          <Link href={`/customers/${customer.id}`} className="hover:underline">
            <div className="font-medium">{customer.name}</div>
            <div className="text-sm text-muted-foreground">{customer.email}</div>
          </Link>
        </td>
        <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
        <td className="px-4 py-3 text-muted-foreground">{customer.address}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(customer.createdAt)}</td>
        <td className="px-4 py-3">{customer.totalOrders}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="bg-muted/50 p-4">
              <div className="text-sm font-medium mb-2">{t('customers.details.orderHistory')}</div>
              <div className="bg-background rounded-lg border shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.orderId')}</th>
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.date')}</th>
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.status')}</th>
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.stage')}</th>
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.sku')}</th>
                      <th className="text-left px-4 py-2 font-medium">{t('orders.table.items')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <Link 
                            href={`/orders/${order.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {order.id}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                        <td className="px-4 py-2"><Badge>{order.status1}</Badge></td>
                        <td className="px-4 py-2"><Badge variant="secondary">{order.status2}</Badge></td>
                        <td className="px-4 py-2 font-mono text-sm">{order.targetSku}</td>
                        <td className="px-4 py-2">{order.items}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch customers');
        setLoading(false);
        console.error('Error fetching customers:', err);
      });
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('customers.searchPlaceholder')}
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-12"></th>
                  <th className="text-left px-4 py-3 font-medium">{t('customers.table.customer')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('customers.table.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('customers.table.address')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('customers.table.created')}</th>
                  <th className="text-left px-4 py-3 font-medium">{t('customers.table.orders')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('customers.loading')}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-red-500">
                      {t('customers.error.fetchFailed')}
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('customers.noCustomers')}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <Row key={customer.id} customer={customer} />
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