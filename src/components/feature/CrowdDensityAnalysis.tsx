'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CrowdDensityAnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Users } from 'lucide-react';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyzeCrowdDensity } from '@/ai/flows/crowd-density-analysis';
import { captureVideoFrame, urlToDataUri } from '@/lib/utils';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

export function CrowdDensityAnalysis() {
  const { zones, addAlert } = useDrishti();
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(zones[0]?.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CrowdDensityAnalysisResult | null>(null);
  const [history, setHistory] = useState<CrowdDensityAnalysisResult[]>([]);
  const { toast } = useToast();

  const getFrameAsDataUri = async (zoneId: string): Promise<string> => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return await urlToDataUri(placeholderImageUrl);

    if (zone.type === 'webcam') {
      const videoElement = document.querySelector(`[data-zone-id="${zoneId}"] video`) as HTMLVideoElement;
      if (videoElement) {
        return captureVideoFrame(videoElement);
      }
    }
    if (zone.type === 'ip-camera' && zone.ipAddress) {
      // Note: This fetches the image again. For real-time streams, this is correct.
      // If it were a static image, we could optimize.
      return await urlToDataUri(zone.ipAddress);
    }
    return await urlToDataUri(placeholderImageUrl);
  }

  const handleAnalysis = async () => {
    if (!selectedZoneId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a zone to analyze.' });
        return;
    }
    
    const zone = zones.find(z => z.id === selectedZoneId);
    if (!zone) return;

    setIsProcessing(true);
    setResult(null);
    toast({ title: 'Analyzing crowd density...', description: `Scanning ${zone.name}.` });
    try {
      const dataUri = await getFrameAsDataUri(selectedZoneId);
      const analysisResult = await analyzeCrowdDensity({ photoDataUri: dataUri, zoneDescription: zone.name });
      
      let densityLevel: 'low' | 'medium' | 'high';
      if (analysisResult.headCount <= 2) {
        densityLevel = 'low';
      } else if (analysisResult.headCount <= 6) {
        densityLevel = 'medium';
      } else {
        densityLevel = 'high';
      }

      const newResult = { ...analysisResult, densityLevel, timestamp: new Date().toISOString(), frameDataUri: dataUri };

      setResult(newResult);
      setHistory(prev => [...prev, newResult].slice(-10)); // Keep last 10 results
      
      addAlert({
        type: 'Crowd Report',
        description: `Density is ${newResult.densityLevel} with ${newResult.headCount} people detected.`,
        riskLevel: newResult.densityLevel === 'high' ? 'high' : newResult.densityLevel === 'medium' ? 'medium' : 'low',
        zoneId: zone.id,
        location: zone.name,
      });

      toast({ title: 'Crowd Analysis Complete', description: `Found ${newResult.headCount} people in ${zone.name}.` });
    } catch (error) {
      console.error('Crowd density analysis failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze crowd density.' });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h4 className="font-semibold">Crowd Density Analysis</h4>
      </div>
      <p className="text-sm text-muted-foreground">Analyze head counts in live footage to assess crowd levels.</p>
      
      <div className="space-y-2">
        <Label>Select Zone</Label>
        <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger>
                <SelectValue placeholder="Select a zone" />
            </SelectTrigger>
            <SelectContent>
                {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
      
      <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing || !selectedZoneId}>
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze Density
      </Button>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            {result.frameDataUri && (
                <div className="aspect-video relative rounded-md overflow-hidden bg-muted border">
                    <Image src={result.frameDataUri} alt="Analyzed frame" layout="fill" objectFit="cover" />
                </div>
            )}
            <div className="space-y-2">
                <div className="flex justify-between"><span>Head Count:</span> <span className="font-bold">{result.headCount}</span></div>
                <div className="flex justify-between"><span>Density Level:</span> <span className="font-bold capitalize">{result.densityLevel}</span></div>
            </div>
            <Separator />
            <p className="text-muted-foreground pt-2">{result.report}</p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Density History (Last 10)</CardTitle>
            </CardHeader>
            <CardContent className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history.map(h => ({ name: new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), count: h.headCount }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
