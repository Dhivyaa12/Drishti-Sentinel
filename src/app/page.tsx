'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/feature/Header';
import { LiveCameraFeed } from '@/components/feature/LiveCameraFeed';
import { SecurityControlPanel } from '@/components/feature/SecurityControlPanel';
import { DrishtiSentinelProvider } from '@/contexts/DrishtiSentinelContext';
import { ZoneStatusTable } from '@/components/feature/zone-status-table';
import { Card } from '@/components/ui/card';
import { AlertsPanel } from '@/components/feature/AlertsPanel';
import AudioAlertManager from '@/components/feature/AudioAlertManager';

const zones = [
  { id: 'zone-a', name: 'Zone A', type: 'webcam' as const, alarmSilenced: false, configurable: false },
  { id: 'zone-b', name: 'Zone B', type: 'ip-camera' as const, alarmSilenced: false, ipAddress: 'http://192.168.137.161:8080/video', configurable: true },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('authenticated');
    if (loggedIn) {
      setIsAuthenticated(true);
    } else {
     if (typeof window !== "undefined") {
       window.location.href = "/login";
     }
    }
  }, []);

  if (!isAuthenticated) {
     return null;
  }

  return (
    <DrishtiSentinelProvider initialZones={zones}>
      <AudioAlertManager />
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 lg:overflow-hidden">
          {/* Left & Center Column: Feeds and Status */}
          <div className="lg:col-span-2 flex flex-col gap-4 lg:overflow-y-auto">
            {/* Camera Feeds Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => (
                <LiveCameraFeed key={zone.id} zoneId={zone.id} />
              ))}
            </div>
            
            {/* Zone Status Section */}
            <Card>
              <ZoneStatusTable />
            </Card>
          </div>
          
          {/* Right Column: Security Control Panel & Alerts */}
          <div className="lg:col-span-1 flex flex-col gap-4 lg:overflow-y-auto">
            <div className="bg-card rounded-lg border flex-shrink-0">
              <SecurityControlPanel />
            </div>
            <div className="bg-card rounded-lg border flex-1 flex flex-col">
              <AlertsPanel />
            </div>
          </div>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
