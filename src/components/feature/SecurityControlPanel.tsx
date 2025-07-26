'use client';

import { AlertsPanel } from './AlertsPanel';
import { ZoneStatusTable } from './zone-status-table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { CrowdDensityAnalysis } from './CrowdDensityAnalysis';
import { FaceMatching } from './FaceMatching';
import { ShieldCheck } from 'lucide-react';

export function SecurityControlPanel() {
  return (
    <div className="flex flex-col h-full bg-card">
        <div className="p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Security Control Panel
            </h3>
            <p className="text-sm text-muted-foreground">Select a tool for advanced security analysis.</p>
        </div>
        <Tabs defaultValue="tools" className="w-full flex flex-col flex-1">
          <TabsList className="grid w-full grid-cols-2 px-4">
            <TabsTrigger value="tools">Analysis Tools</TabsTrigger>
            <TabsTrigger value="status">Status & Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="tools" className="flex-1 overflow-y-auto">
                <CrowdDensityAnalysis />
                <Separator className="my-4" />
                <FaceMatching />
          </TabsContent>
          <TabsContent value="status" className="flex-1 flex flex-col overflow-y-auto">
            <ZoneStatusTable />
            <Separator />
            <div className="flex-1 overflow-y-auto">
                <AlertsPanel />
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
