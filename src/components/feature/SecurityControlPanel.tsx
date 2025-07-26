"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ScanFace } from 'lucide-react';
import { CrowdDensityAnalysis } from './CrowdDensityAnalysis';
import { FaceMatching } from './FaceMatching';

export const SecurityControlPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
        <div className="p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">Security Control Panel</h3>
            <p className="text-sm text-muted-foreground">Select a tool for advanced security analysis.</p>
        </div>
        <Tabs defaultValue="density" className="flex-1 flex flex-col">
            <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="density"><Users className="w-4 h-4 mr-2" />Crowd Density</TabsTrigger>
                    <TabsTrigger value="match"><ScanFace className="w-4 h-4 mr-2" />Face Match</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="density" className="pt-0 flex-1 overflow-y-auto">
              <CrowdDensityAnalysis />
            </TabsContent>
            <TabsContent value="match" className="pt-0 flex-1 overflow-y-auto">
              <FaceMatching />
            </TabsContent>
        </Tabs>
    </div>
  );
};
