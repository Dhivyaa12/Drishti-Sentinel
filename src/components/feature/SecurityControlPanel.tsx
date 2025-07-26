"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import type { LiveCameraFeedRef } from './LiveCameraFeed';
import { faceMatch } from '@/ai/flows/face-matching';
import { analyzeCrowdDensity } from '@/ai/flows/crowd-density-analysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Users, ScanFace, Upload, BarChart, Camera } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CrowdDensityAnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SecurityControlPanelProps {
  zoneARef: React.RefObject<LiveCameraFeedRef>;
  zoneBRef: React.RefObject<LiveCameraFeedRef>;
}

interface DensityResult {
  zoneName: string;
  zoneId: string;
  result: CrowdDensityAnalysisResult;
  frame: string;
}

export const SecurityControlPanel: React.FC<SecurityControlPanelProps> = ({ zoneARef, zoneBRef }) => {
  const { addAlert, isProcessing, setProcessing, zones } = useDrishti();
  const { toast } = useToast();
  const [targetPhoto, setTargetPhoto] = useState<string | null>(null);
  const [targetPhotoName, setTargetPhotoName] = useState<string>('');
  const [matchResult, setMatchResult] = useState<any>(null);
  
  const [densityResults, setDensityResults] = useState<DensityResult[]>([]);
  const [isDensityProcessing, setDensityProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<DensityResult[]>([]);
  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTargetPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaceMatch = async () => {
    if (!targetPhoto || isProcessing('zone-a') || isProcessing('zone-b')) return;
    
    setProcessing('zone-a', true);
    setProcessing('zone-b', true);
    setMatchResult(null);

    try {
      const [frameA, frameB] = await Promise.all([
        zoneARef.current?.captureFrame(),
        zoneBRef.current?.captureFrame()
      ]);

      if (!frameA || !frameB) {
        addAlert({ type: 'System Error', zoneId: 'zone-a', description: 'Failed to capture frames for face matching.', riskLevel: 'medium', location: 'Control Panel' });
        return;
      }

      const result = await faceMatch({
        personOfInterestPhotoDataUri: targetPhoto,
        liveFeedDataUri: frameA, // Pass one frame, AI will compare with person of interest
      });

      // You might want to run faceMatch for each zone and combine results
      // For now, let's assume a simplified single result
      setMatchResult({...result, frameDataUri: frameA, personPhotoDataUri: targetPhoto, zoneName: "Zone A" });

      if (result.matchFound && (result.confidenceScore ?? 0) > 0.75) {
        addAlert({ type: 'Face Match', zoneId: 'zone-a', description: `High-confidence match found.`, riskLevel: 'high', location: 'Zone A'});
      }
    } catch (error) {
        console.error('Face match failed:', error);
        addAlert({ type: 'System Error', zoneId: 'zone-a', description: 'Face match AI analysis failed.', riskLevel: 'medium', location: 'Control Panel' });
    } finally {
        setProcessing('zone-a', false);
        setProcessing('zone-b', false);
    }
  };

  const handleDensityAnalysis = async () => {
    setDensityProcessing(true);
    setDensityResults([]);
    toast({ title: 'Analyzing crowd density for all zones...' });

    try {
      const refs = { 'zone-a': zoneARef, 'zone-b': zoneBRef };
      
      const analysisPromises = zones.map(async (zone) => {
        const zoneRef = refs[zone.id as keyof typeof refs];
        const frame = await zoneRef.current?.captureFrame();

        if (!frame) {
            addAlert({ type: 'System Error', zoneId: zone.id, description: 'Failed to capture frame for density analysis.', riskLevel: 'medium', location: zone.name });
            return null;
        }

        const result = await analyzeCrowdDensity({ photoDataUri: frame, zoneDescription: zone.name });
        return { 
          zoneName: zone.name, 
          zoneId: zone.id,
          result: { ...result, timestamp: new Date().toISOString(), frameDataUri: frame },
          frame
        };
      });

      const results = (await Promise.all(analysisPromises)).filter(Boolean) as DensityResult[];
      setDensityResults(results);
      setHistory(prev => [...results, ...prev].slice(-20));

      results.forEach(res => {
        if (res.result.densityLevel === 'high') {
          addAlert({ type: 'Crowd Report', zoneId: res.zoneId, description: `High density: ${res.result.headCount} people in ${res.zoneName}`, riskLevel: 'high', location: res.zoneName });
        }
      })
      
      toast({ title: "Crowd Analysis Complete", description: `Scanned ${results.length} zones.` });

    } catch (error) {
        console.error('Crowd density analysis failed:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze crowd density.' });
    } finally {
        setDensityProcessing(false);
    }
  };
  
  const densityChartData = zones.map(zone => {
    const latestResultForZone = history.find(h => h.zoneId === zone.id);
    return {
        name: zone.name,
        count: latestResultForZone?.result.headCount || 0,
    }
  });

  const getDensityColor = (category?: 'low' | 'medium' | 'high') => {
      switch (category) {
          case 'low': return 'text-green-400';
          case 'medium': return 'text-yellow-400';
          case 'high': return 'text-orange-400';
          default: return 'text-muted-foreground';
      }
  }

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">Security Control Panel</h3>
            <p className="text-sm text-muted-foreground">Select a tool for advanced security analysis.</p>
        </div>
        <Tabs defaultValue="density" className="flex-1 flex flex-col">
            <div className="px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="density"><Users className="w-4 h-4 mr-2" />Crowd Density</TabsTrigger>
                    <TabsTrigger value="match"><ScanFace className="w-4 h-4 mr-2" />Face Match</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="density" className="pt-4 flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                    <Button onClick={handleDensityAnalysis} disabled={isDensityProcessing} className="w-full">
                        {isDensityProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart className="mr-2 h-4 w-4" />}
                        Analyze All Zones
                    </Button>
                    
                    {densityResults.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Analysis Results</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {densityResults.map((dr) => (
                            <div key={dr.zoneId} className="grid grid-cols-2 gap-4 items-center">
                              <div className="space-y-2">
                                <h4 className="font-semibold">{dr.zoneName}</h4>
                                <p><strong>Head Count:</strong> {dr.result.headCount}</p>
                                <p><strong>Density:</strong> <span className={getDensityColor(dr.result.densityLevel)}>{dr.result.densityLevel}</span></p>
                                <p className="text-xs text-muted-foreground">{dr.result.report}</p>
                              </div>
                              <div className="aspect-video relative rounded-md overflow-hidden bg-muted border">
                                <Image src={dr.frame} alt={`Analyzed frame from ${dr.zoneName}`} layout="fill" objectFit="cover" />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {history.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Headcount History</CardTitle></CardHeader>
                        <CardContent className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={densityChartData} layout="vertical" margin={{ left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={60} />
                              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}/>
                              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="match" className="pt-4 flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="face-photo">Person of Interest</Label>
                  <div className="flex gap-4 items-center">
                      <Button asChild variant="outline">
                          <label htmlFor="photo-upload" className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" /> Upload Photo
                          </label>
                      </Button>
                      <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      {targetPhotoName && <span className="text-sm text-muted-foreground truncate">{targetPhotoName}</span>}
                  </div>
                </div>

                <Button onClick={handleFaceMatch} disabled={!targetPhoto || isProcessing('zone-a') || isProcessing('zone-b')} className="w-full">
                    {(isProcessing('zone-a') || isProcessing('zone-b')) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanFace className="mr-2 h-4 w-4" />}
                    Analyze for Match
                </Button>

                {matchResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Matching Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`flex items-center gap-2 font-semibold text-lg ${matchResult.matchFound ? 'text-accent' : 'text-destructive'}`}>
                                <span>{matchResult.matchFound ? 'Match Found' : 'No Match Found'}</span>
                            </div>
                            {matchResult.matchFound && (
                                <div className="space-y-2 text-sm">
                                    <p><strong>Zone:</strong> {matchResult.zoneName}</p>
                                    <p><strong>Time:</strong> {matchResult.timestamp ? new Date(matchResult.timestamp).toLocaleString() : 'N/A'}</p>
                                    <Label className="text-xs">Confidence</Label>
                                    <Progress value={(matchResult.confidenceScore || 0) * 100} />
                                    <p className="text-xs text-right">{((matchResult.confidenceScore || 0) * 100).toFixed(0)}%</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Person of Interest</Label>
                                    <div className="aspect-square mt-1 relative"><Image src={matchResult.personPhotoDataUri} alt="Target" layout="fill" className="rounded-md object-cover" /></div>
                                </div>
                                <div>
                                     <Label className="text-xs text-muted-foreground">Matched Frame</Label>
                                     <div className="aspect-square mt-1 relative"><Image src={matchResult.frameDataUri} alt="Match" layout="fill" className="rounded-md object-cover" /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
              </div>
            </TabsContent>
        </Tabs>
    </div>
  );
};
