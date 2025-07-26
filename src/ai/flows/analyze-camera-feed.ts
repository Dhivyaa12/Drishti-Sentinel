
'use server';

/**
 * @fileOverview This file defines a consolidated Genkit flow for analyzing camera feeds.
 *
 * It includes:
 * - analyzeCameraFeed - A function to detect anomalies, fire, and strong emotions in a single call.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalyzeCameraFeedInput, AnalyzeCameraFeedOutput, AnomalyType, RiskLevel } from '@/lib/types';


const AnomalyTypesSchema = z.enum([
    "panic_run", "loitering", "crowd_gathering", "fall_detected", "fight",
    "reverse_flow", "entry_breach", "object_abandon", "overcrowd",
    "rapid_dispersion", "hand_cover_face", "cover_eyes", "fire",
    "building_destruction", "flood", "other", "none", "head_covered"
]);

const AnalyzeCameraFeedInputSchema = z.object({
  photoDataUri: z.string().describe(
      "A photo from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  zone: z.string().describe('The zone where the image was captured (e.g., Zone A, Zone B).'),
});


const AnalyzeCameraFeedOutputSchema = z.object({
  anomalyType: AnomalyTypesSchema.describe('The type of anomaly detected.'),
  description: z.string().describe('A description of the detected anomaly or the scene if no anomaly is detected.'),
  riskLevel: z.enum(['Normal', 'low', 'medium', 'high', 'critical']).describe('The assessed risk level.'),
  isAnomaly: z.boolean().describe('Whether any general anomaly was detected.'),
  fireDetected: z.boolean().describe('Whether fire or smoke is detected.'),
  dominantEmotion: z.string().describe('The dominant emotion detected (e.g., anger, fear, neutral).'),
  isStrongEmotion: z.boolean().describe('Whether a strong emotion like anger or fear was detected.'),
});


export async function analyzeCameraFeed(input: AnalyzeCameraFeedInput): Promise<AnalyzeCameraFeedOutput> {
  return analyzeCameraFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCameraFeedPrompt',
  input: {schema: AnalyzeCameraFeedInputSchema},
  output: {schema: AnalyzeCameraFeedOutputSchema},
  prompt: `You are an advanced, all-in-one security AI. Analyze the provided image for multiple types of threats simultaneously.

Image: {{media url=photoDataUri}}
Zone: {{{zone}}}

Your analysis must cover three areas:
1.  **General Anomalies**: Detect one of the following: panic_run, loitering, crowd_gathering, fall_detected, fight, reverse_flow, entry_breach, object_abandon, overcrowd, rapid_dispersion, hand_cover_face, cover_eyes, fire, building_destruction, flood, head_covered, or other. If none, use "none". Set 'isAnomaly' to true if any are found.
2.  **Fire Detection**: Specifically look for fire or smoke. Set 'fireDetected' to true if present.
3.  **Facial Expressions & Coverings**: Analyze visible faces for strong emotions like 'anger' or 'fear'. Also detect if a face is being intentionally covered, hidden, or if the head is covered. Set 'isStrongEmotion' to true if strong emotions are detected.

Based on your complete analysis:
- Provide a consolidated 'description' of the most significant event. If nothing is found, briefly describe the scene.
- Assign a single, overall 'riskLevel' (Normal, low, medium, high, critical) based on the most severe threat detected. Fire is always 'critical'. Strong emotions, face covering, or building destruction are 'high'. Other anomalies vary.

Format your output as a single JSON object matching the following schema:
${JSON.stringify(AnalyzeCameraFeedOutputSchema.describe())}
  `,
});

const analyzeCameraFeedFlow = ai.defineFlow(
  {
    name: 'analyzeCameraFeedFlow',
    inputSchema: AnalyzeCameraFeedInputSchema,
    outputSchema: AnalyzeCameraFeedOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
