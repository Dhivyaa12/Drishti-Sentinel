'use client';

import { ShieldAlert, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';

export function Header() {
  const { handleSos } = useDrishti();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">Drishti Sentinel</h1>
      </div>
      <Button variant="destructive" size="sm" onClick={handleSos}>
        <Siren className="mr-2 h-4 w-4" />
        SOS
      </Button>
    </header>
  );
}
