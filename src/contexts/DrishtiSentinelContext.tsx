
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Alert, Zone, RiskLevel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { makeEmergencyCall } from '@/ai/flows/emergency-call';

interface DrishtiSentinelContextType {
  alerts: Alert[];
  zones: Zone[];
  addAlert: (alertData: Omit<Alert, 'id' | 'timestamp'>) => void;
  toggleAlarmSilence: (zoneId: string) => void;
  getZoneById: (zoneId: string) => Zone | undefined;
  getLatestAlertForZone: (zoneId: string) => Alert | undefined;
  handleSos: () => void;
  toggleZoneSource: (zoneId: string, newType: 'webcam' | 'ip-camera') => void;
  isProcessing: (zoneId: string) => boolean;
  setProcessing: (zoneId: string, status: boolean) => void;
  buzzerOnForZone: string | null;
  setBuzzerZone: (zoneId: string | null) => void;
}

const DrishtiSentinelContext = createContext<DrishtiSentinelContextType | undefined>(undefined);

// Mock coordinates for demo purposes
const zoneCoordinates: { [key: string]: GeolocationCoordinates } = {
  'zone-a': {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  'zone-b': {
    latitude: 19.0760,
    longitude: 72.8777,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
};

export const DrishtiSentinelProvider = ({
  children,
  initialZones,
}: {
  children: ReactNode;
  initialZones: Zone[];
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [processingZones, setProcessingZones] = useState<Set<string>>(new Set());
  const [buzzerOnForZone, setBuzzerZone] = useState<string | null>(null);
  const { toast } = useToast();
  const lastHighRiskAlertId = useRef<string | null>(null);
  
  const originalIpAddresses = useRef(new Map(initialZones.map(z => [z.id, z.ipAddress])));

  useEffect(() => {
    const latestAlert = alerts[0];
    if (latestAlert && latestAlert.id !== lastHighRiskAlertId.current) {
      const zone = zones.find(z => z.id === latestAlert.zoneId);
      const isHighRisk = latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical';
      
      if (isHighRisk) {
        lastHighRiskAlertId.current = latestAlert.id;
        
        if (zone && !zone.alarmSilenced) {
           if(latestAlert.type !== 'SOS Signal') {
             setBuzzerZone(zone.id);
           }
        }
      
        makeEmergencyCall({
            eventDescription: `High risk event: ${latestAlert.type} detected in ${zone?.name || 'an unknown zone'}. Description: ${latestAlert.description}`
        }).then(response => {
            console.log('Emergency call initiated:', response.status);
            toast({
                title: 'Emergency Call Service',
                description: response.status,
            });
        }).catch(err => {
          console.error('Failed to initiate emergency call', err);
          toast({
              variant: 'destructive',
              title: 'Emergency Call Failed',
              description: 'Could not contact emergency services.',
          });
        });
      }
    }
  }, [alerts, zones, toast]);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      coordinates: zoneCoordinates[alertData.zoneId], // Add mock coordinates
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50 alerts
  }, []);

  const toggleAlarmSilence = useCallback((zoneId: string) => {
    setZones(prev =>
      prev.map(zone =>
        zone.id === zoneId ? { ...zone, alarmSilenced: !zone.alarmSilenced } : zone
      )
    );
     if (buzzerOnForZone === zoneId) {
      setBuzzerZone(null);
    }
  }, [buzzerOnForZone]);

  const toggleZoneSource = useCallback((zoneId: string, newType: 'webcam' | 'ip-camera') => {
    setZones(prev =>
      prev.map(zone => {
        if (zone.id === zoneId && zone.configurable) {
          const ipAddress = newType === 'ip-camera' ? originalIpAddresses.current.get(zoneId) : undefined;
          return { ...zone, type: newType, ipAddress };
        }
        return zone;
      })
    );
  }, []);
  
  const getZoneById = useCallback((zoneId: string) => {
    return zones.find(zone => zone.id === zoneId);
  }, [zones]);

  const getLatestAlertForZone = useCallback((zoneId: string) => {
    return alerts.find(alert => alert.zoneId === zoneId);
  }, [alerts]);

  const handleSos = useCallback(() => {
    addAlert({
      type: 'SOS Signal',
      description: 'Manual SOS button activated. Immediate assistance required.',
      riskLevel: 'critical' as RiskLevel,
      zoneId: 'all-zones',
      location: 'Command Center',
    });
    setZones(prev => prev.map(zone => ({ ...zone, alarmSilenced: false })));
    toast({
      variant: 'destructive',
      title: 'SOS ACTIVATED',
      description: 'Emergency alert broadcasted to all units.',
    });
    // Activate buzzer for all zones or a general one
    setBuzzerZone('all-zones');
  }, [addAlert, toast]);

  const setProcessing = useCallback((zoneId: string, status: boolean) => {
    setProcessingZones(prev => {
      const newSet = new Set(prev);
      if (status) {
        newSet.add(zoneId);
      } else {
        newSet.delete(zoneId);
      }
      return newSet;
    });
  }, []);

  const isProcessing = useCallback((zoneId: string) => {
    return processingZones.has(zoneId);
  }, [processingZones]);


  return (
    <DrishtiSentinelContext.Provider value={{ 
      alerts, 
      zones, 
      addAlert, 
      toggleAlarmSilence, 
      getZoneById, 
      getLatestAlertForZone, 
      handleSos, 
      toggleZoneSource,
      isProcessing,
      setProcessing,
      buzzerOnForZone,
      setBuzzerZone
    }}>
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
