'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/feature/Header';
import { LiveCameraFeed } from '@/components/feature/LiveCameraFeed';
import { AlertsPanel } from '@/components/feature/AlertsPanel';
import { DrishtiSentinelProvider } from '@/contexts/DrishtiSentinelContext';

const zones = [
  { id: 'zone-a', name: 'Zone A', type: 'webcam', alarmSilenced: false },
  { id: 'zone-b', name: 'Zone B', type: 'ip-camera', alarmSilenced: false, ipAddress: 'http://192.168.137.161:8080/video' },
];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This is a placeholder for real authentication logic.
    // In a real app, you'd check for a token in localStorage or a cookie.
    const loggedIn = localStorage.getItem('authenticated');
    if (loggedIn) {
      setIsAuthenticated(true);
    } else {
      // If not authenticated, you might want to redirect to login.
      // For this-step-by-step build, we assume they came from the login page.
      // You could add `useRouter` and `router.push('/login')` here.
    }
  }, []);

  // You can show a loader or redirect here
  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('authenticated')) {
     // A simple redirect. For a better UX, consider a loading spinner
     // while checking auth state.
     if (typeof window !== "undefined") {
       window.location.href = "/login";
     }
     return null;
  }

  return (
    <DrishtiSentinelProvider initialZones={zones}>
      <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto">
            {zones.map((zone) => (
              <LiveCameraFeed key={zone.id} zoneId={zone.id} />
            ))}
          </div>
          <aside className="w-full lg:w-[450px] lg:max-w-[33%] border-l flex flex-col">
            <AlertsPanel />
          </aside>
        </main>
      </div>
    </DrishtiSentinelProvider>
  );
}
