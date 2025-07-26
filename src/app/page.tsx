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
        <main className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-full">
            <div className="lg:col-span-2 xl:col-span-3 h-full overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {zones.map((zone) => (
                        <LiveCameraFeed key={zone.id} zoneId={zone.id} />
                    ))}
                </div>
            </div>
            <div className="lg:col-span-1 xl:col-span-1 bg-card h-full overflow-y-auto border-l">
                <SecurityControlPanel />
            </div>
          </div>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
