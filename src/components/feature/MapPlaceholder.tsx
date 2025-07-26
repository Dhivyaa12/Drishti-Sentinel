import Image from 'next/image';
import { Card } from '@/components/ui/card';

export function MapPlaceholder() {
  return (
    <Card className="w-full h-64 bg-muted rounded-lg overflow-hidden relative shadow-inner">
      <Image
        src="https://placehold.co/800x600/e2e8f0/64748b"
        alt="Map placeholder"
        layout="fill"
        objectFit="cover"
        data-ai-hint="world map"
        className="opacity-50"
      />
      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
        <p className="text-card-foreground font-semibold tracking-wider">MAP VIEW OF EVENT LOCATION</p>
      </div>
    </Card>
  );
}
