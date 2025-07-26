'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Zone, FaceMatchResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UploadCloud, UserCheck, UserX } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FaceMatchingProps {
  zone: Zone;
  isProcessing: boolean;
  onAnalyze: (personPhotoDataUri: string) => Promise<any>;
}

export function FaceMatching({ zone, isProcessing, onAnalyze }: FaceMatchingProps) {
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
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

  const handleAnalysis = async () => {
    if (!personPhoto) {
      toast({ variant: 'destructive', title: 'No Photo', description: 'Please upload a photo of the person of interest.' });
      return;
    }
    toast({ title: 'Scanning for face match...', description: `Scanning ${zone.name}.` });
    try {
      const analysisResult = await onAnalyze(personPhoto);
      setResult({ ...analysisResult, personPhotoDataUri: personPhoto });
      const toastMessage = analysisResult.matchFound
        ? `Match found with ${((analysisResult.confidenceScore || 0) * 100).toFixed(0)}% confidence.`
        : 'No match found in the current frame.';
      toast({ title: 'Face Match Complete', description: toastMessage, variant: analysisResult.matchFound ? 'default' : 'secondary' });
    } catch (error) {
      console.error('Face matching failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to perform face match.' });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Upload a photo to scan the live feed for a matching person.</p>
      
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="face-photo">Person of Interest</Label>
        <Input id="face-photo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary"/>
      </div>

      {result && (
        <Card>
            <CardContent className="p-4">
                <div className={`flex items-center gap-2 font-semibold text-lg ${result.matchFound ? 'text-green-500' : 'text-red-500'}`}>
                    {result.matchFound ? <UserCheck /> : <UserX />}
                    {result.matchFound ? 'Match Found' : 'No Match Found'}
                </div>
                {result.matchFound && (
                     <p className="text-sm text-muted-foreground">Confidence: <span className="font-bold text-foreground">{((result.confidenceScore || 0) * 100).toFixed(0)}%</span></p>
                )}
                <Separator className="my-4" />
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

      {personPhoto && !result && (
        <div className="flex justify-center">
            <div className="w-32 h-32 relative rounded-md overflow-hidden border-2 border-primary">
                <Image src={personPhoto} alt="Person of Interest preview" layout="fill" objectFit="cover" />
            </div>
        </div>
      )}

      <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing || !personPhoto}>
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Scan for Match
      </Button>
    </div>
  );
}
