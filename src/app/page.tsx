'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/feature/Header';
import { LiveCameraFeed } from '@/components/feature/LiveCameraFeed';
import { SecurityControlPanel } from '@/components/feature/SecurityControlPanel';
import { DrishtiSentinelProvider } from '@/contexts/DrishtiSentinelContext';

const zones = [
  { id: 'zone-a', name: 'Zone A', type: 'webcam', alarmSilenced: false },
  { id: 'zone-b', name: 'Zone B', type: 'ip-camera', alarmSilenced: false, ipAddress: 'http://192.168.137.161:8080/video' },
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
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto">
            {zones.map((zone) => (
              <LiveCameraFeed key={zone.id} zoneId={zone.id} />
            ))}
          </div>
          <aside className="w-full max-w-md border-l border-border flex flex-col">
            <SecurityControlPanel />
          </aside>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
