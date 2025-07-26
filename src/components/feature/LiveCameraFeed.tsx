'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Loader2, Monitor, ScanSearch, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { urlToDataUri, captureVideoFrame } from '@/lib/utils';
import { detectAnomalies } from '@/ai/flows/detect-anomalies';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

export function LiveCameraFeed({ zoneId }: { zoneId: string }) {
  const { getZoneById, toggleAlarmSilence, addAlert, toggleZoneSource } = useDrishti();
  const zone = getZoneById(zoneId);
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (zone?.type !== 'webcam') {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        return;
    };

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [zone?.type, toast]);


  if (!zone) return null;

  const getFrameAsDataUri = async (): Promise<string> => {
    if (zone.type === 'webcam' && videoRef.current) {
      return captureVideoFrame(videoRef.current);
    }
    if (zone.type === 'ip-camera' && zone.ipAddress) {
      return urlToDataUri(zone.ipAddress);
    }
    return urlToDataUri(placeholderImageUrl);
  }

  const handleAnomalyDetection = async () => {
    setIsProcessing(true);
    toast({ title: 'Analyzing for anomalies...', description: `Scanning ${zone.name}.` });
    try {
      const dataUri = await getFrameAsDataUri();
      const result = await detectAnomalies({ cameraFeedDataUri: dataUri, zone: zone.name });
      
      if (result.anomalies && result.anomalies.length > 0) {
        result.anomalies.forEach(anomaly => {
          addAlert({ ...anomaly, zoneId: zone.id });
        });
        toast({
          variant: 'destructive',
          title: `${result.anomalies.length} Anomaly Detected!`,
          description: `High-risk event identified in ${zone.name}.`,
        });
      } else {
        toast({ title: 'Analysis Complete', description: `No anomalies detected in ${zone.name}.` });
      }
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze feed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSourceToggle = (useIpCam: boolean) => {
    toggleZoneSource(zone.id, useIpCam ? 'ip-camera' : 'webcam');
  };
  
  const isIpCam = zone.type === 'ip-camera';

  return (
    <Card className="flex flex-col" data-zone-id={zone.id}>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" /> {zone.name}
          </CardTitle>
          <CardDescription>{zone.type === 'webcam' ? 'Webcam Feed' : `IP: ${zone.ipAddress}`}</CardDescription>
        </div>
        <Button
          variant={zone.alarmSilenced ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => toggleAlarmSilence(zone.id)}
          aria-label={zone.alarmSilenced ? 'Unsilence alarm' : 'Silence alarm'}
        >
          {zone.alarmSilenced ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted relative">
          {zone.type === 'webcam' ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
              )}
            </>
          ) : (
             zone.ipAddress && (
              <Image
                src={zone.ipAddress}
                alt={`Live feed from ${zone.name}`}
                layout="fill"
                objectFit="cover"
                priority
                unoptimized // Required for IP camera streams
                data-ai-hint="security camera"
                key={zone.ipAddress} // Force re-render on IP change
              />
            )
          )}
          {isProcessing && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                    <p className="font-semibold">AI Analysis in Progress...</p>
                </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-2">
            {zone.configurable && (
              <div className="flex items-center justify-between">
                <Label htmlFor={`ip-cam-switch-${zone.id}`} className="text-sm text-muted-foreground">Use IP Cam</Label>
                <Switch
                  id={`ip-cam-switch-${zone.id}`}
                  checked={isIpCam}
                  onCheckedChange={handleSourceToggle}
                  aria-label="Toggle between IP camera and webcam"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground pt-2">Detect events like fire, loitering, or panic in the current frame.</p>
            <Button className="w-full" onClick={handleAnomalyDetection} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ScanSearch className="w-4 h-4 mr-2"/>
              Scan for Anomalies
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
