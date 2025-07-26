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
import { analyzeCrowdDensity } from '@/ai/flows/crowd-density-analysis';
import { Separator } from '../ui/separator';

const placeholderImageUrl = 'https://placehold.co/1280x720/1a2a3a/ffffff';

type ZoneAnalysisResult = {
    zoneId: string;
    zoneName: string;
} & CrowdDensityAnalysisResult;

export function CrowdDensityAnalysis() {
  const { zones, addAlert } = useDrishti();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ZoneAnalysisResult[]>([]);
  const [history, setHistory] = useState<ZoneAnalysisResult[]>([]);
  const { toast } = useToast();

  const getFrameAsDataUri = async (zoneId: string): Promise<string> => {
    // This function now needs a way to get the data URI.
    // For now, we will return a placeholder.
    // In a real implementation, you would need to get the frame from the video element or IP camera.
    return Promise.resolve(placeholderImageUrl);
  }

  const handleAnalysis = async () => {
    setIsProcessing(true);
    setResults([]);
    toast({ title: 'Analyzing crowd density for all zones...' });
    try {
      const analysisPromises = zones.map(async (zone) => {
        const dataUri = await getFrameAsDataUri(zone.id);
        const analysisResult = await analyzeCrowdDensity({ photoDataUri: dataUri, zoneDescription: zone.name });
        return {
          ...analysisResult,
          zoneId: zone.id,
          zoneName: zone.name,
          timestamp: new Date().toISOString(),
          frameDataUri: dataUri
        };
      });

      const analysisResults = await Promise.all(analysisPromises);
      
      setResults(analysisResults);
      setHistory(prev => [...analysisResults, ...prev].slice(-20));

      analysisResults.forEach(result => {
        if (result.densityLevel === 'high') {
           addAlert({
            type: 'Crowd Report',
            description: `High density detected: ${result.headCount} people in ${result.zoneName}.`,
            riskLevel: 'high',
            zoneId: result.zoneId,
            location: result.zoneName,
          });
        }
      });

      toast({ title: 'Crowd Analysis Complete', description: `Scanned ${zones.length} zones.` });
    } catch (error) {
      console.error('Crowd density analysis failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze crowd density.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const chartData = zones.map(zone => {
    const latestResultForZone = history.find(h => h.zoneId === zone.id);
    return {
        name: zone.name,
        count: latestResultForZone?.headCount || 0,
    }
  });


  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h4 className="font-semibold">Crowd Density Analysis</h4>
      </div>
      <p className="text-sm text-muted-foreground">Analyze head counts in all live feeds simultaneously to assess crowd levels.</p>
      
      <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing}>
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze All Zones
      </Button>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((result, index) => (
              <React.Fragment key={result.zoneId}>
                <div className="space-y-4 pt-4">
                  <h5 className="font-semibold">{result.zoneName}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Details */}
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Head Count:</span>
                        <span className="font-bold">{result.headCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Density Level:</span>
                        <span className="font-bold capitalize">{result.densityLevel}</span>
                      </div>
                      <p className="text-sm text-muted-foreground pt-2">{result.report}</p>
                    </div>
                    {/* Right Column: Image */}
                    {result.frameDataUri && (
                      <div className="aspect-video relative rounded-md overflow-hidden bg-muted border">
                        <Image
                          src={result.frameDataUri}
                          alt={`Analyzed frame from ${result.zoneName}`}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
                {index < results.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Latest Headcount per Zone</CardTitle>
            </CardHeader>
            <CardContent className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={60} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))'
                        }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
