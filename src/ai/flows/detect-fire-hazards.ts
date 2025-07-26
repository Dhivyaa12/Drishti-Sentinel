'use server';
/**
 * @fileOverview This file defines a Genkit flow for detecting fire hazards in camera feeds.
 *
 * - detectFireHazards - A function that takes a camera feed and returns whether a fire is detected.
 * - DetectFireHazardsInput - The input type for the detectFireHazards function.
 * - DetectFireHazardsOutput - The return type for the detectFireHazards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectFireHazardsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  zone: z.string().describe('The zone the camera feed is monitoring.'),
});
export type DetectFireHazardsInput = z.infer<typeof DetectFireHazardsInputSchema>;

const DetectFireHazardsOutputSchema = z.object({
  fireDetected: z.boolean().describe('Whether fire is detected in the camera feed.'),
  confidence: z.number().describe('The confidence level of the fire detection (0-1).'),
});
export type DetectFireHazardsOutput = z.infer<typeof DetectFireHazardsOutputSchema>;

export async function detectFireHazards(input: DetectFireHazardsInput): Promise<DetectFireHazardsOutput> {
  return detectFireHazardsFlow(input);
}

const detectFireHazardsPrompt = ai.definePrompt({
  name: 'detectFireHazardsPrompt',
  input: {schema: DetectFireHazardsInputSchema},
  output: {schema: DetectFireHazardsOutputSchema},
  prompt: `You are an expert security AI specializing in detecting fire hazards in camera feeds.

You will analyze the provided image and determine if there is a fire present.

Respond with whether fire is detected, and a confidence level between 0 and 1.

Image: {{media url=photoDataUri}}

Zone: {{zone}}`,
});

const detectFireHazardsFlow = ai.defineFlow(
  {
    name: 'detectFireHazardsFlow',
    inputSchema: DetectFireHazardsInputSchema,
    outputSchema: DetectFireHazardsOutputSchema,
  },
  async input => {
    const {output} = await detectFireHazardsPrompt(input);
    return output!;
  }
);
