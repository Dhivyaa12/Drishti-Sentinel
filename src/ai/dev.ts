import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-camera-feed.ts';
import '@/ai/flows/face-matching.ts';
import '@/ai/flows/crowd-density-analysis.ts';
