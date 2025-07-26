
"use client";

import { useEffect, useRef } from 'react';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import * as Tone from 'tone';

const AudioAlertManager = () => {
  const { buzzerOnForZone } = useDrishti();
  const audioContextStarted = useRef(false);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    // Initialize synth on the client
    if (typeof window !== 'undefined' && !synth.current) {
        synth.current = new Tone.Synth().toDestination();
    }
  }, []);

  const playAlarm = () => {
    if (!audioContextStarted.current && Tone.context.state !== 'running') {
        Tone.start().catch(e => console.error("Tone.js start failed", e));
        audioContextStarted.current = true;
    }
    
    if (synth.current) {
        const now = Tone.now()
        synth.current.triggerAttackRelease("C5", "8n", now);
        synth.current.triggerAttackRelease("G5", "8n", now + 0.2);
    }
  };
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (buzzerOnForZone) {
      playAlarm(); // Play immediately
      intervalId = setInterval(playAlarm, 2000); // Repeat every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [buzzerOnForZone]);

  return null;
};

export default AudioAlertManager;
