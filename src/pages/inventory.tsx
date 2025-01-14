import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog } from '@/components/ui/dialog';
import { Package, Plus, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Item {
  id: string;
  qrCode: string;
  style: string;
  waist: number;
  length: number;
  shape: string;
  wash: string;
  status1: string;
  status2: string;
  location: string | null;
}

export default function Inventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items');
        if (!response.ok) {
          throw new Error(t('inventory.error.fetchFailed'));
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('inventory.error.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [t]);

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={t('inventory.searchPlaceholder')}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button
              variant="default"
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.addItem')}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.qrCode')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.style')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.waist')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.shape')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.length')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.wash')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.status1')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.status2')}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('inventory.table.location')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('inventory.loading')}
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-destructive">
                      {error}
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      {t('inventory.noItems')}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => (
                    <tr 
                      key={item.id}
                      className={cn(
                        'border-b',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      )}
                    >
                      <td className="px-4 py-3">
                        <Link 
                          href={`/items/${item.qrCode}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.qrCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{item.style}</td>
                      <td className="px-4 py-3">{item.waist}</td>
                      <td className="px-4 py-3">{item.shape}</td>
                      <td className="px-4 py-3">{item.length}</td>
                      <td className="px-4 py-3">{item.wash}</td>
                      <td className="px-4 py-3">{item.status1}</td>
                      <td className="px-4 py-3">{item.status2}</td>
                      <td className="px-4 py-3">{item.location || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
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
    </MobileLayout>
  );
} 