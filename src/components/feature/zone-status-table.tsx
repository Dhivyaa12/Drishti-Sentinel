'use client';

import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/lib/types';

const riskColorMap: { [key in RiskLevel | 'Normal']: string } = {
  Normal: 'bg-green-500',
  low: 'bg-yellow-500',
  medium: 'bg-orange-500',
  high: 'bg-red-600',
  critical: 'bg-red-600',
};

export function ZoneStatusTable() {
  const { zones, getLatestAlertForZone } = useDrishti();

  return (
    <Card className="m-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-medium">
            Zone Status Overview
        </CardTitle>
      </CardHeader>
      <div className="pb-4 px-4">
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
                                <Badge className={`text-white ${badgeColor}`}>
                                    <span className='capitalize'>{risk}</span>
                                </Badge>
                            </TableCell>
                            <TableCell>{anomaly}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{description}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
      </div>
    </Card>
  );
}
