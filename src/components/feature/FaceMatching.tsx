'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import type { FaceMatchResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, UserX, ScanFace, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { faceMatch } from '@/ai/flows/face-matching';
import { Progress } from '../ui/progress';
import { LiveCameraFeedRef } from './LiveCameraFeed';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface FaceMatchingProps {
  zoneARef: React.RefObject<LiveCameraFeedRef>;
  zoneBRef: React.RefObject<LiveCameraFeedRef>;
}

export function FaceMatching({ zoneARef }: FaceMatchingProps) {
  const { zones, addAlert } = useDrishti();
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [personPhotoName, setPersonPhotoName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FaceMatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPersonPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonPhoto(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

   const getFrameAsDataUri = async (zoneRef: React.RefObject<LiveCameraFeedRef>): Promise<string | null> => {
    if (zoneRef.current) {
        return zoneRef.current.captureFrame();
    }
    return null;
  }

  const handleAnalysis = async () => {
    if (!personPhoto) {
      toast({ variant: 'destructive', title: 'No Photo', description: 'Please upload a photo of the person of interest.' });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    toast({ title: 'Scanning Zone A for face match...' });
    
    try {
        const zoneA = zones.find(z => z.name === 'Zone A');
        if (!zoneA) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not find Zone A.' });
             setIsProcessing(false);
             return;
        }
        
        const zoneADataUri = await getFrameAsDataUri(zoneARef);
        
        if (!zoneADataUri) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not capture frame from Zone A.' });
            setIsProcessing(false);
            return;
        }
      
      const analysisResult = await faceMatch({
          targetPhotoDataUri: personPhoto,
          zoneADataUri,
      });

      const matchFound = (analysisResult.matchConfidence || 0) > 75;

      if (matchFound) {
        toast({
          title: `High-Confidence Match Found in ${analysisResult.zoneName}!`,
          description: `Confidence: ${(analysisResult.matchConfidence || 0).toFixed(0)}%`,
        });
        addAlert({
          type: 'Face Match',
          description: `Person of interest found in ${analysisResult.zoneName} with ${(analysisResult.matchConfidence || 0).toFixed(0)}% confidence.`,
          riskLevel: 'high',
          zoneId: zoneA.id,
          location: analysisResult.zoneName,
        });
      } else {
        toast({ title: 'No Match Found', description: `The person of interest was not detected in Zone A.` });
      }

      setResult({
        matchFound,
        confidenceScore: (analysisResult.matchConfidence || 0) / 100,
        timestamp: analysisResult.timestamp || new Date().toISOString(),
        zoneId: zoneA.id,
        zoneName: analysisResult.zoneName,
        frameDataUri: zoneADataUri,
        personPhotoDataUri: personPhoto,
      });


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
        <h4 className="font-semibold">Face Matching Tool</h4>
      </div>
      <p className="text-sm text-muted-foreground">Upload a photo to find a person of interest in Zone A.</p>
      
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                </Button>
                <input
                    id="face-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                />
                {personPhoto && personPhotoName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Avatar className="h-8 w-8">
                            <AvatarImage src={personPhoto} alt="Person of interest" />
                            <AvatarFallback>P</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-xs">{personPhotoName}</span>
                    </div>
                )}
            </div>
            
            <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing || !personPhoto}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ScanFace className="mr-2 h-4 w-4" />
                Analyze Zone A for Match
            </Button>
        </div>
      
      {result && (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Matching Result</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <span className="text-xs text-muted-foreground">Person of Interest</span>
                        <div className="aspect-square relative mt-1 rounded-md overflow-hidden bg-muted border">
                            {personPhoto && <Image src={personPhoto} alt="Person of Interest" layout="fill" objectFit="cover" />}
                        </div>
                    </div>
                </div>
                <Separator />
                <div key={result.zoneId} className="space-y-4">
                    <h3 className="font-semibold text-lg">{result.zoneName}</h3>
                    <div className={`flex items-center gap-2 font-semibold text-md ${result.matchFound ? 'text-accent' : 'text-destructive'}`}>
                        {result.matchFound ? <UserCheck /> : <UserX />}
                        <span>{result.matchFound ? 'Match Found' : 'No Match Found'}</span>
                    </div>

                    <div className="text-sm space-y-2">
                        {result.matchFound && result.timestamp && (
                            <div className="flex justify-between items-center"><span>Appearance Time:</span> <span className="font-mono text-foreground">{new Date(result.timestamp).toLocaleString()}</span></div>
                        )}
                        <div>
                            <span className="text-xs">Confidence</span>
                            <div className="flex items-center gap-2">
                                <Progress value={(result.confidenceScore || 0) * 100} className="w-full h-2" />
                                <span className="font-bold text-foreground text-xs w-12 text-right">{((result.confidenceScore || 0) * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="aspect-video relative mt-1 rounded-md overflow-hidden bg-muted border">
                        {result.frameDataUri && <Image src={result.frameDataUri} alt={`Scanned frame from ${result.zoneName}`} layout="fill" objectFit="cover" />}
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
