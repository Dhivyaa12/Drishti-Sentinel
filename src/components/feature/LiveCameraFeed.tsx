'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Loader2, Monitor, ScanSearch, Users, Volume2, VolumeX, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { urlToDataUri, captureVideoFrame } from '@/lib/utils';
import { detectAnomalies } from '@/ai/flows/detect-anomalies';
import { CrowdDensityAnalysis } from './CrowdDensityAnalysis';
import { FaceMatching } from './FaceMatching';
import { analyzeCrowdDensity } from '@/ai/flows/crowd-density-analysis';
import { faceMatch } from '@/ai/flows/face-matching';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

export function LiveCameraFeed({ zoneId }: { zoneId: string }) {
  const { getZoneById, toggleAlarmSilence, addAlert, getLatestAlertForZone } = useDrishti();
  const zone = getZoneById(zoneId);
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({
    anomaly: false,
    crowd: false,
    face: false,
  });
  
  const latestAlert = getLatestAlertForZone(zoneId);

  useEffect(() => {
    if (zone?.type !== 'webcam') return;

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

  const handleProcessing = (task: string, value: boolean) => {
    setIsProcessing(prev => ({ ...prev, [task]: value }));
  };

  const getFrameAsDataUri = async (): Promise<string> => {
    if (zone.type === 'webcam' && videoRef.current) {
      return captureVideoFrame(videoRef.current);
    }
    if (zone.type === 'ip-camera' && zone.ipAddress) {
      // This is a simplified approach. In a real scenario, you might need
      // a backend proxy to fetch the image to avoid CORS issues.
      return urlToDataUri(zone.ipAddress);
    }
    return urlToDataUri(placeholderImageUrl);
  }

  const handleAnomalyDetection = async () => {
    handleProcessing('anomaly', true);
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
      handleProcessing('anomaly', false);
    }
  };
  
  const StatusIcon = latestAlert ? (latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical' ? AlertTriangle : Info) : ShieldCheck;
  const statusColor = latestAlert ? (latestAlert.riskLevel === 'high' || latestAlert.riskLevel === 'critical' ? 'text-destructive' : 'text-yellow-400') : 'text-green-500';
  const statusText = latestAlert ? latestAlert.type : 'Normal';
  const riskText = latestAlert ? latestAlert.riskLevel : 'None';
  const descriptionText = latestAlert ? latestAlert.description : 'No issues detected.';


  return (
    <Card className="flex flex-col">
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
          {zone.type === 'webcam' && (
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
          )}
          {zone.type === 'ip-camera' && zone.ipAddress && (
            <Image
              src={zone.ipAddress}
              alt={`Live feed from ${zone.name}`}
              layout="fill"
              objectFit="cover"
              priority
              unoptimized // Required for IP camera streams
              data-ai-hint="security camera"
            />
          )}
          {(isProcessing.anomaly || isProcessing.crowd || isProcessing.face) && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                    <p className="font-semibold">AI Analysis in Progress...</p>
                </div>
            </div>
          )}
        </div>
         <Card>
          <CardHeader className='p-2'>
            <CardTitle className='text-sm'>Zone Status</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Description</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className='font-medium'>
                            <div className={`flex items-center gap-2 ${statusColor}`}>
                                <StatusIcon className="h-4 w-4" />
                                <span>{statusText}</span>
                            </div>
                        </TableCell>
                         <TableCell><span className='capitalize'>{riskText}</span></TableCell>
                        <TableCell>{descriptionText}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>
      <CardFooter>
        <Tabs defaultValue="anomaly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anomaly"><ScanSearch className="w-4 h-4 mr-2"/>Anomaly</TabsTrigger>
            <TabsTrigger value="crowd"><Users className="w-4 h-4 mr-2"/>Crowd</TabsTrigger>
            <TabsTrigger value="face">Face Match</TabsTrigger>
          </TabsList>
          <TabsContent value="anomaly" className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">Detect events like fire, loitering, fights, or panic in the current frame.</p>
            <Button className="w-full" onClick={handleAnomalyDetection} disabled={isProcessing.anomaly}>
              {isProcessing.anomaly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Scan for Anomalies
            </Button>
          </TabsContent>
          <TabsContent value="crowd" className="pt-4">
             <CrowdDensityAnalysis 
                zone={zone}
                isProcessing={isProcessing.crowd} 
                onAnalyze={async () => {
                    handleProcessing('crowd', true);
                    const dataUri = await getFrameAsDataUri();
                    const result = await analyzeCrowdDensity({ photoDataUri: dataUri, zoneDescription: zone.name });
                    handleProcessing('crowd', false);
                    return result;
                }}
             />
          </TabsContent>
          <TabsContent value="face" className="pt-4">
            <FaceMatching 
                zone={zone}
                isProcessing={isProcessing.face}
                onAnalyze={async (personPhotoDataUri) => {
                    handleProcessing('face', true);
                    const liveFeedDataUri = await getFrameAsDataUri();
                    const result = await faceMatch({ personOfInterestPhotoDataUri, liveFeedDataUri });
                    if(result.matchFound) {
                        addAlert({
                            type: 'Face Match',
                            description: `Person of interest found with ${((result.confidenceScore || 0) * 100).toFixed(0)}% confidence.`,
                            riskLevel: 'high',
                            zoneId: zone.id,
                            location: zone.name,
                        });
                    }
                    handleProcessing('face', false);
                    return { ...result, frameDataUri: liveFeedDataUri };
                }}
            />
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  );
}
