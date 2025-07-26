'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertsPanel } from './AlertsPanel';
import { BellRing, Settings } from 'lucide-react';

export function SecurityControlPanel() {
  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security Control Panel
            </h2>
            <p className="text-sm text-muted-foreground">Manage alerts and system settings.</p>
        </div>
        <AlertsPanel />
    </div>
  );
}
