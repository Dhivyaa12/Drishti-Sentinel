

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
import { analyzeCameraFeed } from "@/ai/flows/analyze-camera-feed";
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
    const { getZoneById, addAlert, toggleZoneSource, isProcessing, setProcessing, buzzerOnForZone, setBuzzerZone, updateZoneStatus, handleEmergencyCall } = useDrishti();
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

    const captureFrame = useCallback(async (): Promise<string | null> => {
      const canvas = document.createElement('canvas');
      let mediaElement: HTMLVideoElement | HTMLImageElement | null = null;
    
      if (zone?.type === 'webcam' && videoRef.current) {
        mediaElement = videoRef.current;
        canvas.width = mediaElement.videoWidth;
        canvas.height = mediaElement.videoHeight;
      } else if (zone?.type === 'ip-camera' && imageRef.current) {
        mediaElement = imageRef.current;
        canvas.width = mediaElement.naturalWidth;
        canvas.height = mediaElement.naturalHeight;
      }
    
      if (!mediaElement) {
        toast({
          variant: 'destructive',
          title: 'Frame Capture Error',
          description: `Could not get media element for ${zone?.name}.`,
        });
        return null;
      }
    
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
    
        if (zone?.type === 'ip-camera') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = imageRef.current?.src || '';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            ctx.drawImage(img, 0, 0);
        } else {
             ctx.drawImage(mediaElement as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
        }
        
        return canvas.toDataURL('image/jpeg');
      } catch (error) {
        console.error('Error capturing frame:', error);
        toast({
            variant: 'destructive',
            title: 'Frame Capture Failed',
            description: 'Could not convert canvas to data URL. The IP camera may have CORS issues.',
        });
        return null;
      }
    }, [zone?.name, zone?.type, toast]);

    useEffect(() => {
      if (zone?.type === 'ip-camera') {
        const img = imageRef.current;
        if (img) {
          const handleLoad = () => { setIsCamReady(true); setStreamError(null); };
          const handleError = () => { setStreamError("IP camera stream failed. Check URL and network."); setIsCamReady(false); };
          img.addEventListener("load", handleLoad);
          img.addEventListener("error", handleError);
          if (zone.ipAddress) {
            // Add a timestamp to bypass browser cache for the IP camera stream
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
    
    useImperativeHandle(ref, () => ({
      captureFrame,
    }));

    const runScan = useCallback(async () => {
        if (!zone || isProcessing(zone.id)) return;
    
        setProcessing(zone.id, true);
        updateZoneStatus(zone.id, { status: 'Analyzing...' });
    
        const frame = await captureFrame();
        if (!frame) {
            addAlert({ type: 'System Error', zoneId: zone.id, description: 'Failed to capture frame.', riskLevel: 'medium', location: zone.name });
            setProcessing(zone.id, false);
            updateZoneStatus(zone.id, { status: 'Error capturing frame' });
            return;
        }
    
        try {
            const result = await analyzeCameraFeed({ photoDataUri: frame, zone: zone.name });
            
            updateZoneStatus(zone.id, {
                status: result.isAnomaly ? 'Anomaly Detected' : 'Monitoring...',
                riskLevel: result.riskLevel,
                anomaly: result.anomalyType,
                description: result.description,
            });

            if (result.isAnomaly) {
                addAlert({ 
                    type: result.anomalyType, 
                    description: result.description,
                    riskLevel: result.riskLevel,
                    zoneId: zone.id,
                    location: zone.name
                });
                if(result.riskLevel === 'high' || result.riskLevel === 'critical') {
                    if (setBuzzerZone) {
                        setBuzzerZone(zone.id)
                    };
                    handleEmergencyCall(`Threat detected in ${zone.name}: ${result.description}`);
                }
            } else {
                toast({ title: 'All Clear', description: `No anomalies detected in ${zone.name}.`});
            }
    
        } catch (error) {
            console.error('AI analysis failed:', error);
            addAlert({ type: 'System Error', zoneId: zone.id, description: 'AI analysis failed.', riskLevel: 'medium', location: zone.name });
            updateZoneStatus(zone.id, { status: 'AI analysis failed' });
        } finally {
            setProcessing(zone.id, false);
        }
    }, [zone, isProcessing, setProcessing, addAlert, captureFrame, setBuzzerZone, toast, updateZoneStatus, handleEmergencyCall]);

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
            <img ref={imageRef} className="w-full h-full object-cover rounded-md" alt={`Live feed from ${zone.name}`} crossOrigin="anonymous"/>
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
            {(buzzerOnForZone === zone.id || buzzerOnForZone === 'all-zones') && setBuzzerZone && (
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
