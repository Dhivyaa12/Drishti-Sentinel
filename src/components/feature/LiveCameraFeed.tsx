'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Loader2, Monitor, ScanSearch, Users, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { urlToDataUri } from '@/lib/utils';
import { detectAnomalies } from '@/ai/flows/detect-anomalies';
import { CrowdDensityAnalysis } from './CrowdDensityAnalysis';
import { FaceMatching } from './FaceMatching';
import { analyzeCrowdDensity } from '@/ai/flows/crowd-density-analysis';
import { faceMatch } from '@/ai/flows/face-matching';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

export function LiveCameraFeed({ zoneId }: { zoneId: string }) {
  const { getZoneById, toggleAlarmSilence, addAlert } = useDrishti();
  const zone = getZoneById(zoneId);
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({
    anomaly: false,
    crowd: false,
    face: false,
  });

  if (!zone) return null;

  const handleProcessing = (task: string, value: boolean) => {
    setIsProcessing(prev => ({ ...prev, [task]: value }));
  };

  const handleAnomalyDetection = async () => {
    handleProcessing('anomaly', true);
    toast({ title: 'Analyzing for anomalies...', description: `Scanning ${zone.name}.` });
    try {
      const dataUri = await urlToDataUri(placeholderImageUrl);
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

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" /> {zone.name}
          </CardTitle>
          <CardDescription>Live feed monitoring</CardDescription>
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
          <Image
            src={placeholderImageUrl}
            alt={`Live feed from ${zone.name}`}
            layout="fill"
            objectFit="cover"
            priority
            data-ai-hint="security camera"
          />
          {(isProcessing.anomaly || isProcessing.crowd || isProcessing.face) && (
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
        <Tabs defaultValue="anomaly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anomaly"><ScanSearch className="w-4 h-4 mr-2"/>Anomaly</TabsTrigger>
            <TabsTrigger value="crowd"><Users className="w-4 h-4 mr-2"/>Crowd</TabsTrigger>
            <TabsTrigger value="face"><Users className="w-4 h-4 mr-2"/>Face Match</TabsTrigger>
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
                    const dataUri = await urlToDataUri(placeholderImageUrl);
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
                    const liveFeedDataUri = await urlToDataUri(placeholderImageUrl);
                    const result = await faceMatch({ personOfInterestPhotoDataUri: personPhotoDataUri, liveFeedDataUri });
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
