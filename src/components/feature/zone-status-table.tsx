'use client';

import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/lib/types';
import { ListVideo } from 'lucide-react';

const riskColorMap: { [key in RiskLevel | 'Normal']: string } = {
  Normal: 'bg-green-500',
  low: 'bg-yellow-500',
  medium: 'bg-orange-500',
  high: 'bg-red-500',
  critical: 'bg-red-700',
};

export function ZoneStatusTable() {
  const { zones, getLatestAlertForZone } = useDrishti();

  return (
    <div className="p-0">
        <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-2">
                <ListVideo className="h-5 w-5" />
                Zone Status Overview
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Zone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Anomaly</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {zones.map(zone => {
                        const latestAlert = getLatestAlertForZone(zone.id);
                        
                        const status = latestAlert ? 'Alert' : 'Monitoring...';
                        const risk = latestAlert ? latestAlert.riskLevel : 'Normal';
                        const anomaly = latestAlert ? latestAlert.type : 'None';
                        const description = latestAlert ? latestAlert.description : 'No issues detected.';
                        const badgeColor = riskColorMap[risk as keyof typeof riskColorMap] || 'bg-gray-500';

                        return (
                            <TableRow key={zone.id}>
                                <TableCell className="font-medium">{zone.name}</TableCell>
                                <TableCell>{status}</TableCell>
                                <TableCell>
                                    <Badge variant="default" className={`text-white ${badgeColor}`}>
                                        <span className='capitalize'>{risk}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell>{anomaly}</TableCell>
                                <TableCell className="max-w-[250px] truncate" title={description}>
                                    {description}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </CardContent>
    </div>
  );
}
