"use client";

import { useDrishti } from "@/contexts/DrishtiSentinelContext";
import type { RiskLevel } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListVideo } from "lucide-react";

const riskLevelColors: Record<RiskLevel, string> = {
    Normal: "bg-green-500",
    low: "bg-yellow-500",
    medium: "bg-orange-500",
    high: "bg-red-500",
    critical: "bg-red-700",
};

const ZoneStatusTable = () => {
  const { zoneStatuses } = useDrishti();

  return (
    <div className="p-0">
        <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-2">
                <ListVideo className="h-5 w-5" />
                Zone Status Overview
            </CardTitle>
        </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[100px]">Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Anomaly</TableHead>
                    <TableHead className="min-w-[250px]">Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {zoneStatuses.map((zoneStatus) => (
                    <TableRow key={zoneStatus.zoneId}>
                        <TableCell className="font-medium">{zoneStatus.zoneName}</TableCell>
                        <TableCell>{zoneStatus.status}</TableCell>
                        <TableCell>
                            <Badge className={`capitalize ${riskLevelColors[zoneStatus.riskLevel]} text-white hover:${riskLevelColors[zoneStatus.riskLevel]}`}>
                                {zoneStatus.riskLevel}
                            </Badge>
                        </TableCell>
                        <TableCell>{zoneStatus.anomaly}</TableCell>
                        <TableCell className="max-w-[250px] truncate" title={zoneStatus.description}>{zoneStatus.description}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </div>
  );
};

export default ZoneStatusTable;
