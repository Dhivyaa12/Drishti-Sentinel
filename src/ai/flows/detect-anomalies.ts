'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting various anomalies in real-time from camera feeds.
 *
 * It includes:
 * - detectAnomalies - A function to detect a range of anomalies and assess risk.
 * - DetectAnomaliesInput - The input type for the detectAnomalies function.
 * - DetectAnomaliesOutput - The return type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyTypesSchema = z.enum([
    "panic_run",
    "loitering",
    "crowd_gathering",
    "fall_detected",
    "fight",
    "reverse_flow",
    "entry_breach",
    "object_abandon",
    "overcrowd",
    "rapid_dispersion",
    "hand_cover_face",
    "cover_eyes",
    "fire",
    "building_destruction",
    "flood",
    "other",
    "none"
]);

const DetectAnomaliesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  zone: z.string().describe('The zone where the image was captured (e.g., Zone A, Zone B).'),
});
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const DetectAnomaliesOutputSchema = z.object({
  anomalyType: AnomalyTypesSchema.describe('The type of anomaly detected.'),
  description: z.string().describe('A description of the detected anomaly or the scene if no anomaly is detected.'),
  riskLevel: z.string().describe('The assessed risk level (Normal, Medium, High, Critical).'),
  isAnomaly: z.boolean().describe('Whether any anomaly was detected.'),
});
export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;


export async function detectAnomalies(input: DetectAnomaliesInput): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  prompt: `You are an advanced security AI tasked with detecting a wide range of anomalies from a still image from a camera feed.

Analyze the provided image from the specified zone and identify if any of the following anomalies are present:
- panic_run: People running in a panicked manner.
- loitering: Individuals or groups lingering in an area for an unusual amount of time without apparent purpose.
- crowd_gathering: A rapid and unusual gathering of a crowd.
- fall_detected: A person who has fallen down.
- fight: Physical altercation between two or more people.
- reverse_flow: People moving against the normal flow of traffic.
- entry_breach: Unauthorized entry into a restricted area.
- object_abandon: An abandoned object like a bag or box.
- overcrowd: An unsafe number of people in a confined space.
- rapid_dispersion: A crowd suddenly and quickly dispersing.
- hand_cover_face: A person intentionally covering their face with their hands.
- cover_eyes: A person covering their eyes.
- fire: Presence of fire or smoke.
- building_destruction: Damage to structures.
- flood: Presence of flooding.
- other: Any other suspicious activity not listed.
- none: If no anomalies are detected.

Image: {{media url=photoDataUri}}
Zone: {{{zone}}}

Based on your analysis:
1.  Set 'isAnomaly' to true if any anomaly is detected, otherwise false.
2.  Set 'anomalyType' to the corresponding detected anomaly type from the list. If no anomaly is detected, set it to "none".
3.  Provide a 'description' of the event. If no anomaly is found, provide a brief, one-sentence description of the scene.
4.  Assign a 'riskLevel' (Normal, Medium, High, Critical) based on the severity of the detected anomaly. "Normal" for "none".

Format your output as a JSON object matching the following schema:
${JSON.stringify(DetectAnomaliesOutputSchema.describe())}
  `,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);