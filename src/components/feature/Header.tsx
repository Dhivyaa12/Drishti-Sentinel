"use client";

import { ShieldCheck, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';

const Header = () => {
  const { handleSos } = useDrishti();

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-card shrink-0">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Drishti Sentinel
        </h1>
      </div>
      <Button variant="destructive" size="lg" onClick={handleSos}>
        <Siren className="w-5 h-5 mr-2" />
        SOS
      </Button>
    </header>
  );
};

export default Header;
