'use server';

/**
 * @fileOverview Implements the face matching flow.
 *
 * This file exports:
 * - `faceMatch` - An async function that takes an image and searches camera feeds for a match.
 * - `FaceMatchInput` - The input type for the faceMatch function.
 * - `FaceMatchOutput` - The output type for the faceMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceMatchInputSchema = z.object({
  targetPhotoDataUri: z
    .string()
    .describe(
      "A photo of the target person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  zoneADataUri: z
    .string()
    .describe(
      "A photo of zone A, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type FaceMatchInput = z.infer<typeof FaceMatchInputSchema>;

const FaceMatchOutputSchema = z.object({
    matchConfidence: z
        .number()
        .describe('The confidence percentage (0-100) of a face match in the zone.'),
    zoneName: z
        .string()
        .describe('The name of the zone where the face match was attempted (e.g., "Zone A").'),
    timestamp: z
        .string()
        .optional()
        .describe('The timestamp when the face was seen.'),
});


export type FaceMatchOutput = z.infer<typeof FaceMatchOutputSchema>;

export async function faceMatch(input: FaceMatchInput): Promise<FaceMatchOutput> {
  return faceMatchFlow(input);
}

const faceMatchPrompt = ai.definePrompt({
  name: 'faceMatchPrompt',
  input: {schema: FaceMatchInputSchema},
  output: {schema: FaceMatchOutputSchema},
  prompt: `You are an expert in face recognition and analysis.

You are provided with a target photo and a snapshot from Zone A.

Analyze the zone's snapshot to determine if the target face is present.

Target Photo: {{media url=targetPhotoDataUri}}
Zone A Snapshot: {{media url=zoneADataUri}}

Provide a confidence percentage (0-100) indicating the likelihood of a face match.
If a match is found, provide a timestamp for when the face was seen. If no match is found, leave the timestamp field blank.

Return your response as a single JSON object. Ensure your output matches the following schema:
${JSON.stringify(FaceMatchOutputSchema.describe, null, 2)}`,
});

const faceMatchFlow = ai.defineFlow(
  {
    name: 'faceMatchFlow',
    inputSchema: FaceMatchInputSchema,
    outputSchema: FaceMatchOutputSchema,
  },
  async input => {
    const {output} = await faceMatchPrompt({...input, zoneName: 'Zone A'});
    return output!;
  }
);
