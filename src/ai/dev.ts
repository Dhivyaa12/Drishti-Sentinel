import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-camera-feed.ts';
import '@/ai/flows/face-matching.ts';
import '@/ai/flows/crowd-density-analysis.ts';
import '@/ai/flows/detect-fire-hazards.ts';
import '@/ai/flows/detect-anomalies.ts';
import '@/ai/flows/analyze-facial-expressions.ts';
