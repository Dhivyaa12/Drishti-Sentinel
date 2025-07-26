'use client';

import { AlertsPanel } from './AlertsPanel';
import { ZoneStatusTable } from './zone-status-table';
import { Separator } from '@/components/ui/separator';

export function SecurityControlPanel() {
  return (
    <div className="flex flex-col h-full bg-card">
        <ZoneStatusTable />
        <Separator />
        <div className="flex-1 overflow-y-auto">
            <AlertsPanel />
        </div>
    </div>
  );
}
