'use client';

import React, { useState } from 'react';
import { Zone, CrowdDensityAnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface CrowdDensityAnalysisProps {
  zone: Zone;
  isProcessing: boolean;
  onAnalyze: () => Promise<any>;
}

export function CrowdDensityAnalysis({ zone, isProcessing, onAnalyze }: CrowdDensityAnalysisProps) {
  const [result, setResult] = useState<CrowdDensityAnalysisResult | null>(null);
  const [history, setHistory] = useState<CrowdDensityAnalysisResult[]>([]);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    toast({ title: 'Analyzing crowd density...', description: `Scanning ${zone.name}.` });
    try {
      const analysisResult = await onAnalyze();
      const newResult = { ...analysisResult, timestamp: new Date().toISOString() };
      setResult(newResult);
      setHistory(prev => [...prev, newResult].slice(-10)); // Keep last 10 results
      toast({ title: 'Crowd Analysis Complete', description: `Found ${newResult.headCount} people in ${zone.name}.` });
    } catch (error) {
      console.error('Crowd density analysis failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to analyze crowd density.' });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Estimate the number of people and assess crowd density in the current frame.</p>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between"><span>Head Count:</span> <span className="font-bold">{result.headCount}</span></div>
            <div className="flex justify-between"><span>Density Level:</span> <span className="font-bold capitalize">{result.densityLevel}</span></div>
            <p className="text-muted-foreground pt-2">{result.report}</p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history.map(h => ({ name: new Date(h.timestamp).toLocaleTimeString(), count: h.headCount }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      )}

      <Button className="w-full" onClick={handleAnalysis} disabled={isProcessing}>
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Analyze Crowd
      </Button>
    </div>
  );
}
