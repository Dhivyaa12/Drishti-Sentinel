
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Alert, Zone, RiskLevel, ZoneStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocation from '@/hooks/use-location';

interface DrishtiSentinelContextType {
  alerts: Alert[];
  zones: Zone[];
  zoneStatuses: ZoneStatus[];
  updateZoneStatus: (zoneId: string, newStatus: Partial<Omit<ZoneStatus, 'zoneId' | 'zoneName'>>) => void;
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
  handleEmergencyCall: (reason: string) => void;
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
  const [processingZones, setProcessingZones] = useState<Set<string>>(new Set());
  const [buzzerOnForZone, setBuzzerZone] = useState<string | null>(null);
  const { toast } = useToast();
  const lastHighRiskAlertId = useRef<string | null>(null);
  const { location } = useLocation();

  const [zoneStatuses, setZoneStatuses] = useState<ZoneStatus[]>(
    initialZones.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      status: 'Monitoring...',
      riskLevel: 'Normal',
      anomaly: 'None',
      description: 'No issues detected.',
    }))
  );

  const updateZoneStatus = useCallback((zoneId: string, newStatus: Partial<Omit<ZoneStatus, 'zoneId' | 'zoneName'>>) => {
    setZoneStatuses(prevStatuses =>
      prevStatuses.map(status =>
        status.zoneId === zoneId ? { ...status, ...newStatus } : status
      )
    );
  }, []);
  
  const originalIpAddresses = useRef(new Map(initialZones.map(z => [z.id, z.ipAddress])));

  const handleEmergencyCall = useCallback((eventDescription: string) => {
    // Mock emergency call
    console.log('MOCK_CALL_SERVICE: Calling emergency services (100). Reason: ' + eventDescription);
    toast({
        variant: "destructive",
        title: 'Emergency Action Required!',
        description: `Auto-calling emergency contact: 100`,
    });
     if (typeof window !== 'undefined') {
        window.location.href = `tel:100`;
    }
  }, [toast]);

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
      
        handleEmergencyCall(
          `High risk event: ${latestAlert.type} detected in ${zone?.name || 'an unknown zone'}. Description: ${latestAlert.description}`
        );
      }
    }
  }, [alerts, zones, handleEmergencyCall]);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const zone = getZoneById(alertData.zoneId);
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      coordinates: location || undefined,
      location: alertData.location || (location ? `${location.latitude}, ${location.longitude}`: (zone?.name || 'Unknown')),
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 50));
    
    // Update zone status based on alert
    const { zoneId, riskLevel, type, description } = newAlert;
    updateZoneStatus(zoneId, {
        status: 'Alert Triggered',
        riskLevel,
        anomaly: type,
        description,
    });

  }, [location, updateZoneStatus, getZoneById]);

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
    const description = 'Manual SOS button activated. Immediate assistance required.';
    addAlert({
      type: 'SOS Signal',
      description,
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
    setBuzzerZone('all-zones');
    handleEmergencyCall(description);
  }, [addAlert, toast, handleEmergencyCall]);

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
      zoneStatuses,
      updateZoneStatus,
      addAlert, 
      toggleAlarmSilence, 
      getZoneById, 
      getLatestAlertForZone, 
      handleSos, 
      toggleZoneSource,
      isProcessing,
      setProcessing,
      buzzerOnForZone,
      setBuzzerZone,
      handleEmergencyCall
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
