"use client";

import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface MapViewProps {
    selectedLocation: string | null;
}

export default function MapView({ selectedLocation }: MapViewProps) {
  return (
    <Card className="w-full h-full bg-muted rounded-none relative shadow-inner">
      <Image
        src="https://placehold.co/800x600/1a2a3a/4a5a6a"
        alt="Map placeholder"
        layout="fill"
        objectFit="cover"
        data-ai-hint="world map"
        className="opacity-30"
      />
      <div className="absolute inset-0 bg-black/10 flex items-center justify-center p-4">
        {selectedLocation ? (
             <div className="text-center">
                <p className="text-card-foreground font-semibold tracking-wider">MAP VIEW</p>
                <p className="text-sm text-muted-foreground mt-1">Showing location for:</p>
                <p className="text-lg font-bold text-primary">{selectedLocation}</p>
             </div>
        ) : (
            <p className="text-card-foreground font-semibold tracking-wider text-center">SELECT AN ALERT TO VIEW ITS LOCATION</p>
        )}
      </div>
       <a
            href={selectedLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 text-xs bg-background/80 backdrop-blur-sm text-foreground py-1 px-3 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-disabled={!selectedLocation}
        >
            Open in Google Maps
        </a>
    </Card>
  );
}
