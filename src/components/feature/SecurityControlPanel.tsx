'use client';

import { BellRing, ListVideo } from 'lucide-react';
import { AlertsPanel } from './AlertsPanel';
import { ZoneStatusPanel } from './ZoneStatusPanel';
import { Separator } from '@/components/ui/separator';

export function SecurityControlPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Security Control Panel
        </h2>
        <p className="text-sm text-muted-foreground">
          Aggregated status and alerts from all zones.
        </p>
      </div>
      <ZoneStatusPanel />
      <Separator />
      <AlertsPanel />
    </div>
  );
}
