'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Alert, Zone, RiskLevel } from '@/lib/types';
import * as Tone from 'tone';
import { useToast } from '@/hooks/use-toast';

interface DrishtiSentinelContextType {
  alerts: Alert[];
  zones: Zone[];
  addAlert: (alertData: Omit<Alert, 'id' | 'timestamp'>) => void;
  toggleAlarmSilence: (zoneId: string) => void;
  getZoneById: (zoneId: string) => Zone | undefined;
  handleSos: () => void;
}

const DrishtiSentinelContext = createContext<DrishtiSentinelContextType | undefined>(undefined);

export const DrishtiSentinelProvider = ({
  children,
  initialZones,
}: {
  children: ReactNode;
  initialZones: Zone[];
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const { toast } = useToast();
  const lastPlayedAlertId = useRef<string | null>(null);

  useEffect(() => {
    const latestAlert = alerts[0];
    if (latestAlert && latestAlert.id !== lastPlayedAlertId.current) {
      const zone = zones.find(z => z.id === latestAlert.zoneId);
      if (zone && !zone.alarmSilenced && (latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical')) {
        Tone.start();
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("C5", "8n", Tone.now());
        synth.triggerAttackRelease("G5", "8n", Tone.now() + 0.2);
        lastPlayedAlertId.current = latestAlert.id;
      }
    }
  }, [alerts, zones]);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const toggleAlarmSilence = useCallback((zoneId: string) => {
    setZones(prev =>
      prev.map(zone =>
        zone.id === zoneId ? { ...zone, alarmSilenced: !zone.alarmSilenced } : zone
      )
    );
  }, []);
  
  const getZoneById = useCallback((zoneId: string) => {
    return zones.find(zone => zone.id === zoneId);
  }, [zones]);

  const handleSos = useCallback(() => {
    addAlert({
      type: 'SOS Signal',
      description: 'Manual SOS button activated. Immediate assistance required.',
      riskLevel: 'critical',
      zoneId: 'all-zones',
      location: 'Command Center',
    });
    setZones(prev => prev.map(zone => ({ ...zone, alarmSilenced: false })));
    toast({
      variant: 'destructive',
      title: 'SOS ACTIVATED',
      description: 'Emergency alert broadcasted to all units.',
    });
  }, [addAlert, toast]);

  return (
    <DrishtiSentinelContext.Provider value={{ alerts, zones, addAlert, toggleAlarmSilence, getZoneById, handleSos }}>
      {children}
    </DrishtiSentinelContext.Provider>
  );
};

export const useDrishti = (): DrishtiSentinelContextType => {
  const context = useContext(DrishtiSentinelContext);
  if (context === undefined) {
    throw new Error('useDrishti must be used within a DrishtiSentinelProvider');
  }
  return context;
};
