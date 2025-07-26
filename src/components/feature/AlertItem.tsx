'use client';

import { Alert as AlertType, RiskLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Flame, Users, ScanFace, Frown, Siren, MapPin, Clock } from 'lucide-react';
import { MapPlaceholder } from './MapPlaceholder';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';

const riskVariantMap: { [key in RiskLevel]: 'destructive' | 'secondary' | 'outline' } = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const iconMap: { [key: string]: React.ElementType } = {
  fire: Flame,
  crowd: Users,
  'face match': ScanFace,
  loitering: Frown,
  fight: Frown,
  panic: Frown,
  default: Siren,
};

export function AlertItem({ alert }: { alert: AlertType }) {
  const { getZoneById } = useDrishti();
  const zone = getZoneById(alert.zoneId);

  const Icon = iconMap[alert.type.toLowerCase()] || iconMap.default;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader className="p-4 flex flex-row items-start gap-4 space-y-0">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="grid gap-1 flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{alert.type}</CardTitle>
                <Badge variant={riskVariantMap[alert.riskLevel]} className="capitalize text-xs">
                  {alert.riskLevel}
                </Badge>
              </div>
              <CardDescription className="text-xs">{alert.description}</CardDescription>
              <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{zone?.name || 'Unknown Zone'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Icon className="w-6 h-6" />
            Alert Details: {alert.type}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge variant={riskVariantMap[alert.riskLevel]} className="capitalize text-base">{alert.riskLevel}</Badge>
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="font-mono text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
            </div>
             <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Zone</p>
                <p className="text-sm font-medium">{zone?.name || 'Unknown Zone'}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-base">{alert.description}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground mb-2">Location</p>
                <MapPlaceholder />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
