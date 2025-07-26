'use client';

import { Header } from '@/components/feature/Header';
import { LiveCameraFeed } from '@/components/feature/LiveCameraFeed';
import { AlertsPanel } from '@/components/feature/AlertsPanel';
import { DrishtiSentinelProvider } from '@/contexts/DrishtiSentinelContext';

const zones = [
  { id: 'zone-1', name: 'Zone 1: Main Entrance', alarmSilenced: false },
  { id: 'zone-2', name: 'Zone 2: Perimeter West', alarmSilenced: false },
];

export default function Home() {
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
