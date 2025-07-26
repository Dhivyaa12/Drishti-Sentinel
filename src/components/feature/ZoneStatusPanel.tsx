'use client';

import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, AlertTriangle, Info, ListVideo } from 'lucide-react';

export function ZoneStatusPanel() {
  const { zones, getLatestAlertForZone } = useDrishti();

  return (
    <div className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
            <ListVideo className="h-5 w-5" />
            Zone Status
        </CardTitle>
      </CardHeader>
      <div className="px-4 pb-4">
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="hidden md:table-cell">Last Event</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {zones.map(zone => {
                    const latestAlert = getLatestAlertForZone(zone.id);
                    const StatusIcon = latestAlert ? (latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical' ? AlertTriangle : Info) : ShieldCheck;
                    const statusColor = latestAlert ? (latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical' ? 'text-destructive' : 'text-yellow-400') : 'text-green-500';
                    const statusText = latestAlert ? latestAlert.type : 'Normal';
                    const riskText = latestAlert ? latestAlert.riskLevel : 'None';
                    const descriptionText = latestAlert ? latestAlert.description : 'No issues detected.';

                    return (
                        <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>
                                <div className={`flex items-center gap-2 ${statusColor}`}>
                                    <StatusIcon className="h-4 w-4" />
                                    <span>{statusText}</span>
                                </div>
                            </TableCell>
                            <TableCell><span className='capitalize'>{riskText}</span></TableCell>
                            <TableCell className="hidden md:table-cell">{descriptionText}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
