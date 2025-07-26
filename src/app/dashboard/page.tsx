
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/feature/Header';
import { LiveCameraFeed, LiveCameraFeedRef } from '@/components/feature/LiveCameraFeed';
import { SecurityControlPanel } from '@/components/feature/SecurityControlPanel';
import { DrishtiSentinelProvider } from '@/contexts/DrishtiSentinelContext';
import ZoneStatusTable from '@/components/feature/zone-status-table';
import { Card } from '@/components/ui/card';
import AlertsPanel from '@/components/feature/AlertsPanel';
import AudioAlertManager from '@/components/feature/AudioAlertManager';
import { useRouter } from 'next/navigation';


const zones = [
  { id: 'zone-a', name: 'Zone A', type: 'webcam' as const, alarmSilenced: false, configurable: false },
  { id: 'zone-b', name: 'Zone B', type: 'ip-camera' as const, alarmSilenced: false, ipAddress: 'http://192.168.137.161:8080/video', configurable: true },
];

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const zoneARef = useRef<LiveCameraFeedRef>(null);
  const zoneBRef = useRef<LiveCameraFeedRef>(null);

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('authenticated');
    if (loggedIn) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <p>Redirecting to login...</p>
      </div>
     );
  }

  return (
    <DrishtiSentinelProvider initialZones={zones}>
      <AudioAlertManager />
      <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-y-auto">
        <Header />
        <main className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
          {/* Left & Center Column: Feeds and Status */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            {/* Camera Feeds Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LiveCameraFeed ref={zoneARef} key={zones[0].id} zoneId={zones[0].id} />
              <LiveCameraFeed ref={zoneBRef} key={zones[1].id} zoneId={zones[1].id} />
            </div>
            
            {/* Zone Status Section */}
            <Card>
              <ZoneStatusTable />
            </Card>
          </div>
          
          {/* Right Column: Security Control Panel & Alerts */}
          <div className="xl:col-span-1 flex flex-col gap-4">
             <SecurityControlPanel zoneARef={zoneARef} zoneBRef={zoneBRef}/>
             <AlertsPanel />
          </div>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
