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
  zoneBDataUri: z
    .string()
    .describe(
      "A photo of zone B, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type FaceMatchInput = z.infer<typeof FaceMatchInputSchema>;

const FaceMatchOutputSchema = z.object({
  matchConfidenceZoneA: z
    .number()
    .describe('The confidence percentage (0-100) of a face match in Zone A.'),
  matchConfidenceZoneB: z
    .number()
    .describe('The confidence percentage (0-100) of a face match in Zone B.'),
  firstSeenTimestampZoneA: z
    .string()
    .optional()
    .describe('The timestamp when the face was first seen in Zone A.'),
  lastSeenTimestampZoneB: z
    .string()
    .optional()
    .describe('The timestamp when the face was last seen in Zone B.'),
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

You are provided with a target photo, and two snapshots from Zone A and Zone B.

Analyze the images and determine if the target face is present in either zone.

Target Photo: {{media url=targetPhotoDataUri}}
Zone A Snapshot: {{media url=zoneADataUri}}
Zone B Snapshot: {{media url=zoneBDataUri}}

Provide a confidence percentage (0-100) for each zone, indicating the likelihood of a face match.
If a match is found, provide a timestamp for when the face was first seen in Zone A (firstSeenTimestampZoneA) and last seen in Zone B (lastSeenTimestampZoneB). If no match is found, leave the timestamp fields blank.

Ensure your output matches the following schema:
${JSON.stringify(FaceMatchOutputSchema.describe, null, 2)}`,
});

const faceMatchFlow = ai.defineFlow(
  {
    name: 'faceMatchFlow',
    inputSchema: FaceMatchInputSchema,
    outputSchema: FaceMatchOutputSchema,
  },
  async input => {
    const {output} = await faceMatchPrompt(input);
    return output!;
  }
);
