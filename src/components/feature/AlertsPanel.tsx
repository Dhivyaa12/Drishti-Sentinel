'use client';

import { BellRing, ShieldX } from 'lucide-react';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertItem } from './AlertItem';

export function AlertsPanel() {
  const { alerts } = useDrishti();

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                <ShieldX className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">All Clear</p>
                <p className="text-sm">No alerts to display at this time.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  );
}
