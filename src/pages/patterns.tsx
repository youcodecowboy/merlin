import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Printer,
  Clock,
  CheckCircle2,
  Package,
  CalendarDays,
  Search,
  ChevronRight,
  Timer,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Pattern {
  id: string;
  sku: string;
  quantity: number;
  requestedDate: string;
  completedDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'PENDING' | 'COMPLETED';
  notes?: string;
}

function PatternCard({ pattern, onComplete }: { pattern: Pattern; onComplete?: () => void }) {
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: pattern.id,
          action: 'complete'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pattern status');
      }

      toast({
        title: 'Success',
        description: 'Pattern marked as completed',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update pattern',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{pattern.sku}</h3>
          </div>
          <Badge variant={
            pattern.priority === 'high' ? 'danger' :
            pattern.priority === 'medium' ? 'warning' : 'success'
          }>
            {pattern.priority} priority
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-muted-foreground">Quantity</div>
            <div className="font-medium">{pattern.quantity} units</div>
          </div>
          <div>
            <div className="text-muted-foreground">Requested</div>
            <div className="font-medium">
              {new Date(pattern.requestedDate).toLocaleDateString()}
            </div>
          </div>
          {pattern.completedDate && (
            <>
              <div>
                <div className="text-muted-foreground">Completed</div>
                <div className="font-medium">
                  {new Date(pattern.completedDate).toLocaleDateString()}
                </div>
              </div>
            </>
          )}
          {pattern.notes && (
            <div className="col-span-2">
              <div className="text-muted-foreground">Notes</div>
              <div className="font-medium">{pattern.notes}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/production/${pattern.id}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            View Production Request
          </Link>
          {pattern.status === 'PENDING' && onComplete && (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleComplete}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Mark as Printed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Patterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = async () => {
    try {
      const response = await fetch('/api/patterns');
      if (!response.ok) {
        throw new Error('Failed to fetch patterns');
      }
      const data = await response.json();
      setPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
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
            <h3 className="font-semibold">Error Loading Patterns</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const pendingPatterns = patterns.filter(p => p.status === 'PENDING');
  const completedPatterns = patterns.filter(p => p.status === 'COMPLETED');

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Patterns</h1>
          <Printer className="h-6 w-6 text-muted-foreground" />
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Pending ({pendingPatterns.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed ({completedPatterns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingPatterns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending patterns
              </div>
            ) : (
              pendingPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onComplete={fetchPatterns}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedPatterns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed patterns
              </div>
            ) : (
              completedPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
} 