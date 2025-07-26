'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FaceMatchResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserCheck, UserX, ScanFace } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { faceMatch } from '@/ai/flows/face-matching';
import { captureVideoFrame, urlToDataUri } from '@/lib/utils';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

export function FaceMatching() {
  const { zones, addAlert } = useDrishti();
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FaceMatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonPhoto(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

   const getFrameAsDataUri = async (zoneId: string): Promise<string> => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return urlToDataUri(placeholderImageUrl);

    if (zone.type === 'webcam') {
      const videoElement = document.querySelector(`[data-zone-id="${zoneId}"] video`) as HTMLVideoElement;
      if (videoElement) {
        return captureVideoFrame(videoElement);
      }
    }
    if (zone.type === 'ip-camera' && zone.ipAddress) {
      return urlToDataUri(zone.ipAddress);
    }
    return urlToDataUri(placeholderImageUrl);
  }

  const handleAnalysis = async () => {
    if (!personPhoto) {
      toast({ variant: 'destructive', title: 'No Photo', description: 'Please upload a photo of the person of interest.' });
      return;
    }
    
    setIsProcessing(true);
    toast({ title: 'Scanning all zones for face match...' });
    
    try {
      // Analyze all zones in parallel
      const results = await Promise.all(zones.map(async (zone) => {
        const liveFeedDataUri = await getFrameAsDataUri(zone.id);
        const matchResult = await faceMatch({ personOfInterestPhotoDataUri: personPhoto, liveFeedDataUri });
        return { ...matchResult, frameDataUri: liveFeedDataUri, zoneName: zone.name, zoneId: zone.id };
      }));
      
      const bestMatch = results.reduce((prev, current) => {
        return (prev.confidenceScore || 0) > (current.confidenceScore || 0) ? prev : current;
      });

      setResult({ ...bestMatch, personPhotoDataUri: personPhoto });

      if (bestMatch.matchFound) {
        toast({
          title: `Match Found in ${bestMatch.zoneName}!`,
          description: `Confidence: ${((bestMatch.confidenceScore || 0) * 100).toFixed(0)}%`,
        });
        addAlert({
          type: 'Face Match',
          description: `Person of interest found in ${bestMatch.zoneName} with ${((bestMatch.confidenceScore || 0) * 100).toFixed(0)}% confidence.`,
          riskLevel: 'high',
          zoneId: bestMatch.zoneId,
          location: bestMatch.zoneName,
        });
      } else {
        toast({ title: 'No Match Found', description: 'The person of interest was not detected in any zone.' });
      }

    } catch (error) {
      console.error('Face matching failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to perform face match analysis.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
       <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5" />
        <h4 className="font-semibold">Face Matching</h4>
      </div>
      <p className="text-sm text-muted-foreground">Upload a photo to scan all live feeds for a matching person.</p>
      
      <div className="space-y-2">
        <Label htmlFor="face-photo">Person of Interest Photo</Label>
        <Input id="face-photo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary"/>
      </div>
      
      <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing || !personPhoto}>
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze for Match
      </Button>

      {personPhoto && !result && (
        <div className="flex justify-center p-4">
            <div className="w-32 h-32 relative rounded-md overflow-hidden border-2 border-primary bg-muted">
                <Image src={personPhoto} alt="Person of Interest preview" layout="fill" objectFit="cover" />
            </div>
        </div>
      )}

      {result && (
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className={`flex items-center gap-2 font-semibold text-lg ${result.matchFound ? 'text-green-500' : 'text-red-500'}`}>
                    {result.matchFound ? <UserCheck /> : <UserX />}
                    <span>{result.matchFound ? 'Match Found' : 'No Match Found'}</span>
                </div>

                {result.matchFound && (
                     <div className="text-sm">
                        <p>Confidence: <span className="font-bold text-foreground">{((result.confidenceScore || 0) * 100).toFixed(0)}%</span></p>
                        <p>Timestamp: <span className="font-mono text-foreground">{new Date(result.timestamp!).toLocaleString()}</span></p>
                     </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs">Person of Interest</Label>
                        <div className="aspect-square relative mt-1 rounded-md overflow-hidden bg-muted">
                            {result.personPhotoDataUri && <Image src={result.personPhotoDataUri} alt="Person of Interest" layout="fill" objectFit="cover" />}
                        </div>
                    </div>
                     <div>
                        <Label className="text-xs">Matched Frame</Label>
                        <div className="aspect-square relative mt-1 rounded-md overflow-hidden bg-muted">
                            {result.frameDataUri && <Image src={result.frameDataUri} alt="Matched Frame" layout="fill" objectFit="cover" />}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
