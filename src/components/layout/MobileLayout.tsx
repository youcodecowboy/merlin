import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  Menu,
  Home,
  Package,
  User,
  Scan,
  Settings,
  LogOut,
  Factory,
  Droplets,
  ClipboardCheck,
  Sparkles,
  Box,
  Truck,
  Warehouse,
  Container,
  Power,
  Printer,
  Search,
  QrCode
} from 'lucide-react';
import { ScannerDialog } from '@/components/ScannerDialog';
import type { ScannerMode } from '@/components/ScannerModeSelector';
import { toast } from 'sonner';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Enhanced debug logging for language changes
  useEffect(() => {
    console.log('MobileLayout language:', i18n.language);
    console.log('Translation test - management:', t('common.management'));
    console.log('Translation test - production:', t('nav.production'));
    console.log('Translation test - appName:', t('common.appName'));
  }, [i18n.language, t]);

  const handleScanComplete = async (result: { mode: ScannerMode; data: string }) => {
    // Always navigate to item details for the sticky footer scanner
    await router.push(`/items/${result.data}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-[280px] bg-background p-4 transition-transform duration-300 ease-in-out z-50',
          {
            'translate-x-0': isDrawerOpen,
            '-translate-x-full': !isDrawerOpen,
          }
        )}
      >
        {/* Drawer Header with Logo */}
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="w-24 h-24 relative mb-4">
            <Image
              src="/logo.webp"
              alt="MERLIN Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-primary">MERLIN</h1>
          <p className="text-sm text-muted-foreground">{t('common.appName')}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {t('common.management')}
            </h2>
            <div className="space-y-1">
              <Link href="/" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Home className="h-5 w-5" />
                  {t('nav.dashboard')}
                </Button>
              </Link>
              <Link href="/customers" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="h-5 w-5" />
                  {t('nav.customers')}
                </Button>
              </Link>
              <Link href="/orders" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Package className="h-5 w-5" />
                  {t('nav.orders')}
                </Button>
              </Link>
              <Link href="/inventory" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Package className="h-5 w-5" />
                  {t('nav.items')}
                </Button>
              </Link>
              <Link href="/storage" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Container className="h-5 w-5" />
                  {t('nav.storage')}
                </Button>
              </Link>
              <Link href="/find-requests" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Search className="h-5 w-5" />
                  {t('nav.findRequests')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {t('common.production')}
            </h2>
            <div className="space-y-1">
              <Link href="/production" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Factory className="h-5 w-5" />
                  {t('nav.production')}
                </Button>
              </Link>
              <Link href="/patterns" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Printer className="h-5 w-5" />
                  {t('nav.patterns')}
                </Button>
              </Link>
              <Link href="/warehouse" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Power className="h-5 w-5" />
                  {t('nav.activation')}
                </Button>
              </Link>
              <Link href="/wash" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Droplets className="h-5 w-5" />
                  {t('nav.wash')}
                </Button>
              </Link>
              <Link href="/qc" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  {t('nav.qualityControl')}
                </Button>
              </Link>
              <Link href="/finishing" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t('nav.finishing')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              {t('common.fulfillment')}
            </h2>
            <div className="space-y-1">
              <Link href="/packing" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Box className="h-5 w-5" />
                  {t('nav.packing')}
                </Button>
              </Link>
              <Link href="/shipping" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Truck className="h-5 w-5" />
                  {t('nav.shipping')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="px-3 py-2 mt-auto">
            <div className="space-y-1">
              <Link href="/settings" passHref>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-5 w-5" />
                  {t('common.settings')}
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 mt-8 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          {t('common.logout')}
        </Button>
      </div>

      {/* Header */}
      <header className="sticky top-0 border-b bg-background z-30">
        <div className="container flex items-center justify-between h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image
                src="/logo.webp"
                alt="MERLIN Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-lg">MERLIN</span>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-4">
        {children}
      </main>

      {/* Sticky Footer Navigation */}
      <footer className="sticky bottom-0 border-t bg-background">
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <Home className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowScanner(true);
            }}
          >
            <QrCode className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </footer>

      {/* Scanner Dialog */}
      <ScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        defaultMode="lookup"
        location={router.pathname.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
        onScanComplete={(result) => {
          if (result.nextAction) {
            if (result.nextAction.type === 'NAVIGATE') {
              router.push(result.nextAction.data.path);
            }
          }
          setShowScanner(false);
        }}
        onScanError={(error) => {
          toast.error(error);
        }}
      />
    </div>
  );
} 