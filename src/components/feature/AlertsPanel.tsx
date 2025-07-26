"use client";

import React, { useState } from "react";
import { useDrishti } from "@/contexts/DrishtiSentinelContext";
import { AlertTriangle, MapPin, Clock, Map, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RiskLevel } from "@/lib/types";
import MapView from "./map-view";
import { formatDistanceToNow } from 'date-fns';

const riskLevelClasses: Record<RiskLevel, { bg: string, border: string, text: string, badge: "destructive" | "secondary" | "outline" }> = {
    low: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', badge: 'outline' },
    medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', badge: 'secondary' },
    high: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', badge: 'destructive' },
    critical: { bg: 'bg-red-700/10', border: 'border-red-700/50', text: 'text-red-600', badge: 'destructive' },
};

const AlertsPanel = () => {
  const { alerts, getZoneById } = useDrishti();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const handleViewOnMap = (location: string | null) => {
    if (location) {
      setSelectedLocation(location);
    }
  };

  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Centralized Alerts Panel</CardTitle>
            <CardDescription>Real-time security alerts from all zones.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <ScrollArea className="h-96 -mr-4 pr-4">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                  <ShieldX className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">All Clear</p>
                  <p className="text-sm">No alerts to display at this time.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const colors = riskLevelClasses[alert.riskLevel] || riskLevelClasses.medium;
                const zone = getZoneById(alert.zoneId);
                return (
                <Card key={alert.id} className={`shadow-sm ${colors.bg} border ${colors.border}`}>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className={`text-base font-semibold ${colors.text}`}>{alert.type}</CardTitle>
                      <Badge variant={colors.badge} className="capitalize">
                        {alert.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pt-1">{alert.description}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" />
                                <span>{zone?.name || alert.location || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                <span>{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
                            </div>
                        </div>
                       {alert.location && (
                        <Button variant="ghost" size="sm" className="text-xs h-auto py-0.5 px-1.5" onClick={() => handleViewOnMap(alert.location)}>
                          <Map className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )})
            )}
          </div>
        </ScrollArea>
        <div>
            <Card className="overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
                    <Map className="h-5 w-5 text-primary"/>
                    <div>
                        <CardTitle className="text-base">Alert Location</CardTitle>
                        <CardDescription className="text-xs">Geographic location of the selected alert.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-72px)]">
                    <MapView selectedLocation={selectedLocation}/>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
