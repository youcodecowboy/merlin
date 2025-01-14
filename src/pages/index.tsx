import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Factory,
  Archive,
  Droplets,
  Sparkles,
  Package,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();

  const productionStages = [
    { 
      name: 'PRODUCTION', 
      icon: Factory,
      unitsInStage: 245,
      unitsAwaiting: 120,
      status: 'warning',
      href: '/production'
    },
    { 
      name: 'STOCK', 
      icon: Archive,
      unitsInStage: 1890,
      unitsAwaiting: 0,
      status: 'success',
      href: '/storage'
    },
    { 
      name: 'WASH', 
      icon: Droplets,
      unitsInStage: 342,
      unitsAwaiting: 78,
      status: 'warning',
      href: '/wash'
    },
    { 
      name: 'FINISHING', 
      icon: Sparkles,
      unitsInStage: 156,
      unitsAwaiting: 200,
      status: 'danger',
      href: '/finishing'
    },
    { 
      name: 'PACKING', 
      icon: Package,
      unitsInStage: 89,
      unitsAwaiting: 45,
      status: 'warning',
      href: '/packing'
    }
  ];

  return (
    <MobileLayout>
      <div className="space-y-6">
        {/* Quick Search */}
        <Card>
          <Card.Header>
            <Card.Title>{t('dashboard.quickSearch.title')}</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex gap-2">
              <Input 
                placeholder={t('dashboard.quickSearch.placeholder')}
                className="flex-1"
              />
              <Button variant="default" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Production Stages */}
        <div className="grid gap-4 sm:grid-cols-2">
          {productionStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link key={stage.name} href={stage.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <Card.Title>{t(`nav.${stage.name.toLowerCase()}`)}</Card.Title>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {stage.unitsInStage.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          {t('dashboard.productionStages.unitsInStage')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={stage.status as any}>
                          {stage.unitsAwaiting} {t('dashboard.productionStages.awaiting')}
                        </Badge>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
