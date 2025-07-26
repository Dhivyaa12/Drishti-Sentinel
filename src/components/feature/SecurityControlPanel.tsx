'use client';

import { CrowdDensityAnalysis } from './CrowdDensityAnalysis';
import { FaceMatching } from './FaceMatching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Users, ScanFace } from 'lucide-react';
import { AlertsPanel } from './AlertsPanel';
import { BellRing } from 'lucide-react';

export function SecurityControlPanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Security Control Panel
        </h3>
        <p className="text-sm text-muted-foreground">Central hub for alerts and analysis.</p>
      </div>

      <Tabs defaultValue="alerts" className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">
              <BellRing className="mr-2 h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="crowd-density">
              <Users className="mr-2 h-4 w-4" />
              Crowd Density
            </TabsTrigger>
            <TabsTrigger value="face-match">
              <ScanFace className="mr-2 h-4 w-4" />
              Face Match
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="alerts" className="flex-1 flex flex-col overflow-y-auto">
          <AlertsPanel />
        </TabsContent>

        <TabsContent value="crowd-density" className="flex-1 overflow-y-auto">
          <CrowdDensityAnalysis />
        </TabsContent>
        
        <TabsContent value="face-match" className="flex-1 overflow-y-auto">
          <FaceMatching />
        </TabsContent>
      </Tabs>
    </div>
  );
}
