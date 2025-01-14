import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Truck,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Mock data for shipped items
const MOCK_SHIPPED_ITEMS = Array.from({ length: 50 }, (_, i) => ({
  itemId: `ITEM${String(i + 1).padStart(3, '0')}`,
  sku: i % 3 === 0 ? 'TSH-CLS-BLK-M' : i % 3 === 1 ? 'JNS-SLM-BLU-32' : 'HDY-BLK-L',
  customerName: ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis'][i % 4],
  orderId: `ORD-2024-${String(i + 1).padStart(3, '0')}`,
  trackingNumber: `TRK${String(100000 + i).padStart(6, '0')}`,
  status: ['shipped', 'in_transit', 'delivered', 'exception'][i % 4],
  timestamp: new Date(2024, 0, 9, 14, 30 + i).toISOString()
}));

const SHIPPING_STATUSES = [
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' }
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'shipped':
      return <Badge>Shipped</Badge>;
    case 'in_transit':
      return <Badge variant="warning">In Transit</Badge>;
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>;
    case 'exception':
      return <Badge variant="danger">Exception</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
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

interface FilterState {
  search: string;
  status: string;
}

export default function Shipping() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: ''
  });

  const itemsPerPage = 25;

  // Filter items based on search and status
  const filteredItems = MOCK_SHIPPED_ITEMS.filter(item => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = filters.search === '' ||
      item.itemId.toLowerCase().includes(searchLower) ||
      item.orderId.toLowerCase().includes(searchLower) ||
      item.trackingNumber.toLowerCase().includes(searchLower) ||
      item.customerName.toLowerCase().includes(searchLower);

    const matchesStatus = filters.status === '' || item.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shipping</h1>
          <Truck className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by Item ID, Order ID, Tracking Number, or Customer Name"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-[200px]">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">All Statuses</option>
                {SHIPPING_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Shipping Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ITEM ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CUSTOMER NAME</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ORDER ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TRACKING NUMBER</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">STATUS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
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
                      <div className="font-mono text-sm">{item.trackingNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateTime(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
} 