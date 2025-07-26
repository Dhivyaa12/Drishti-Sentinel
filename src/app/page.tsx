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
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 lg:overflow-hidden">
          {/* Camera Feeds Section */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:overflow-y-auto">
            {zones.map((zone) => (
              <LiveCameraFeed key={zone.id} zoneId={zone.id} />
            ))}
          </div>
          
          {/* Security Control Panel Section */}
          <div className="lg:col-span-1 bg-card rounded-lg border lg:overflow-y-auto">
            <SecurityControlPanel />
          </div>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
