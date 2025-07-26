

"use client";

import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback
} from "react";
import { cn } from "@/lib/utils";
import { Camera, VideoOff, WifiOff, Loader2, Scan, BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Zone } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "@/components/ui/button";
import { useDrishti } from "@/contexts/DrishtiSentinelContext";
import { detectAnomalies } from "@/ai/flows/detect-anomalies";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface LiveCameraFeedRef {
  captureFrame: () => Promise<string | null>;
}

interface LiveCameraFeedProps {
  zoneId: string;
}

const LiveCameraFeed = forwardRef<LiveCameraFeedRef, LiveCameraFeedProps>(
  ({ zoneId }, ref) => {
    const { getZoneById, addAlert, toggleZoneSource, isProcessing, setProcessing, buzzerOnForZone, setBuzzerZone } = useDrishti();
    const zone = getZoneById(zoneId);

    const videoRef = useRef<HTMLVideoElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [isCamReady, setIsCamReady] = useState(false);
    const { toast } = useToast();
    const [key, setKey] = useState(Math.random());

    useEffect(() => {
        setKey(Math.random());
        setIsCamReady(false);
        setStreamError(null);
    }, [zone?.ipAddress, zone?.type]);

    useEffect(() => {
      if (zone?.type === 'ip-camera') {
        const img = imageRef.current;
        if (img) {
          const handleLoad = () => { setIsCamReady(true); setStreamError(null); };
          const handleError = () => { setStreamError("IP camera stream failed. Check URL and network."); setIsCamReady(false); };
          img.addEventListener("load", handleLoad);
          img.addEventListener("error", handleError);
          if (zone.ipAddress) {
            img.src = `${zone.ipAddress}?timestamp=${new Date().getTime()}`;
          }
          return () => {
            img.removeEventListener("load", handleLoad);
            img.removeEventListener("error", handleError);
          };
        }
        return;
      }
      
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({video: true});
          setHasCameraPermission(true);
          setStreamError(null);
  
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play().catch(err => {
                    console.error("Video play failed:", err);
                    setStreamError("Could not start camera feed.");
                    setIsCamReady(false);
                });
            };
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setStreamError("Webcam access denied or not available.");
          setIsCamReady(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
        }
      };
  
      getCameraPermission();

      const videoEl = videoRef.current;
      const handleCanPlay = () => {
        setIsCamReady(true);
      }
      videoEl?.addEventListener('canplay', handleCanPlay);
      
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }
        videoEl?.removeEventListener('canplay', handleCanPlay);
      }
    }, [zone?.type, zone?.ipAddress, toast, key]);
    
    const captureFrame = async (): Promise<string | null> => {
      // This function now needs a way to get the data URI.
      // For now, we will return a placeholder.
      // In a real implementation, you would need to get the frame from the video element or IP camera.
      return Promise.resolve(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      );
    };

    useImperativeHandle(ref, () => ({
      captureFrame,
    }));

    const runScan = useCallback(async () => {
      if (!zone || isProcessing(zone.id)) return;
  
      setProcessing(zone.id, true);
  
      const frame = await captureFrame();
      if (!frame) {
        addAlert({ type: 'System Error', zoneId: zone.id, description: 'Failed to capture frame.', riskLevel: 'medium', location: zone.name });
        setProcessing(zone.id, false);
        return;
      }
  
      try {
        const result = await detectAnomalies({ cameraFeedDataUri: frame, zone: zone.name });
        
        if (result.anomalies && result.anomalies.length > 0) {
            result.anomalies.forEach(anomaly => {
                addAlert({ ...anomaly, zoneId: zone.id });
                if(anomaly.riskLevel === 'high' || anomaly.riskLevel === 'critical') {
                    if (setBuzzerZone) setBuzzerZone(zone.id);
                }
            });
        } else {
            toast({ title: 'All Clear', description: `No anomalies detected in ${zone.name}.`});
        }
  
      } catch (error) {
        console.error('AI analysis failed:', error);
        addAlert({ type: 'System Error', zoneId: zone.id, description: 'AI analysis failed.', riskLevel: 'medium', location: zone.name });
      } finally {
        setProcessing(zone.id, false);
      }
    }, [zone, isProcessing, setProcessing, addAlert, captureFrame, setBuzzerZone, toast]);

    if (!zone) return null;

    const renderFeed = () => {
        if (streamError && zone.type === 'webcam') {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-md">
                    <VideoOff className="w-12 h-12 text-destructive" />
                    <p className="mt-2 text-sm text-muted-foreground text-center px-2">{streamError}</p>
                     {!hasCameraPermission && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            );
        }

        if (streamError && zone.type === 'ip-camera') {
             return (
                <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-md">
                    <WifiOff className="w-12 h-12 text-destructive" />
                    <p className="mt-2 text-sm text-muted-foreground text-center px-2">{streamError}</p>
                </div>
            );
        }
        
        const videoElement = zone.type === 'ip-camera' ? (
            <img ref={imageRef} className="w-full h-full object-cover rounded-md" alt={`Live feed from ${zone.name}`}/>
        ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-md transform scale-x-[-1]" />
        );

        return (
            <>
                {!isCamReady && !streamError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center h-full bg-muted/50 rounded-md animate-pulse">
                        <Camera className="w-12 h-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Initializing camera...</p>
                    </div>
                )}
                <div className="w-full h-full">
                    {videoElement}
                </div>
                 {isProcessing(zone.id) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                            <p className="font-semibold">AI Analysis in Progress...</p>
                        </div>
                    </div>
                )}
            </>
        )
    }

    const content = (
        <>
            <CardContent className="p-0 flex-1 relative">
            <div className="aspect-video w-full">
                {renderFeed()}
            </div>
            {buzzerOnForZone === zone.id && setBuzzerZone && (
                <div className="absolute top-2 left-2 flex items-center gap-2">
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => setBuzzerZone(null)}
                        className="animate-pulse"
                    >
                        <BellOff className="mr-2 h-4 w-4" />
                        Stop Alarm
                    </Button>
                </div>
            )}
            </CardContent>
            <CardFooter className="p-2 flex flex-col items-stretch space-y-2">
            <Button onClick={runScan} disabled={isProcessing(zone.id) || !isCamReady} className="w-full">
              {isProcessing(zone.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scan className="mr-2 h-4 w-4" />}
              Scan for Anomalies
            </Button>
            </CardFooter>
        </>
    );

    return (
      <Card className="overflow-hidden shadow-lg flex flex-col" data-zone-id={zone.id} key={key}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
          <CardTitle className="text-lg font-medium">{zone.name}</CardTitle>
          <div className="flex items-center gap-2">
            {zone.configurable && toggleZoneSource && (
              <div className="flex items-center space-x-2">
                <Label htmlFor={`cam-switch-${zone.id}`} className="text-xs">IP Cam</Label>
                <Switch
                  id={`cam-switch-${zone.id}`}
                  checked={zone.type === 'webcam'}
                  onCheckedChange={(isChecked) => toggleZoneSource(zone.id, isChecked ? 'webcam' : 'ip-camera')}
                  aria-label="Toggle camera source"
                />
                 <Label htmlFor={`cam-switch-${zone.id}`} className="text-xs">Lap Cam</Label>
              </div>
            )}
            {isCamReady && (
                <Badge variant="default" className={cn("bg-green-500/80", { 'bg-blue-500/80': zone.type === 'ip-camera' })}>
                    {zone.type === 'ip-camera' ? 'IP CAM' : 'LIVE'}
                </Badge>
            )}
            <Camera className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        {content}
      </Card>
    );
  }
);

LiveCameraFeed.displayName = "LiveCameraFeed";
export { LiveCameraFeed };
