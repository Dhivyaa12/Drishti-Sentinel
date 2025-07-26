
"use client";

import { useEffect, useRef } from 'react';
import { useDrishti } from '@/contexts/DrishtiSentinelContext';
import * as Tone from 'tone';

const AudioAlertManager = () => {
  const { buzzerOnForZone } = useDrishti();
  const audioContextStarted = useRef(false);
  const alarmSynth = useRef<Tone.MonoSynth | null>(null);
  const alarmInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize synth on the client
    if (typeof window !== 'undefined' && !alarmSynth.current) {
        alarmSynth.current = new Tone.MonoSynth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.5,
                release: 1
            }
        }).toDestination();
    }
  }, []);

  const playAlarm = () => {
    if (!audioContextStarted.current && Tone.context.state !== 'running') {
        Tone.start().catch(e => console.error("Tone.js start failed", e));
        audioContextStarted.current = true;
    }
    
    if (alarmSynth.current) {
        const now = Tone.now();
        // Short, distinct two-tone siren pulse
        alarmSynth.current.triggerAttackRelease("A5", "8n", now);
        alarmSynth.current.triggerAttackRelease("C6", "8n", now + 0.5);
    }
  };

  const stopAlarm = () => {
    if (alarmInterval.current) {
      clearInterval(alarmInterval.current);
      alarmInterval.current = null;
    }
    if (alarmSynth.current) {
        // Stop any currently playing sound and cancel future scheduled events
        alarmSynth.current.triggerRelease(Tone.now());
    }
  }
  
  useEffect(() => {
    if (buzzerOnForZone) {
      playAlarm(); // Play immediately
      alarmInterval.current = setInterval(playAlarm, 1000); // Repeat every second
    } else {
        stopAlarm();
    }

    return () => {
      stopAlarm();
    };
  }, [buzzerOnForZone]);

  return null;
};

export default AudioAlertManager;
