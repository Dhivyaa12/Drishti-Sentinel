'use server';
/**
 * @fileOverview Implements face matching functionality.
 *
 * - faceMatch - A function that accepts a photo of a person of interest and scans live feeds for matches.
 * - FaceMatchInput - The input type for the faceMatch function.
 * - FaceMatchOutput - The return type for the faceMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FaceMatchInputSchema = z.object({
  personOfInterestPhotoDataUri: z
    .string()
    .describe(
      "A photo of a person of interest, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  liveFeedDataUri: z
    .string()
    .describe(
      "A live camera feed frame, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FaceMatchInput = z.infer<typeof FaceMatchInputSchema>;

const FaceMatchOutputSchema = z.object({
  matchFound: z.boolean().describe('Whether a match was found in the live feed.'),
  confidenceScore: z
    .number()
    .describe('The confidence score of the match (0-1), or null if no match.'),
  timestamp: z.string().optional().describe('The timestamp of the match, or null if no match.'),
});
export type FaceMatchOutput = z.infer<typeof FaceMatchOutputSchema>;

export async function faceMatch(input: FaceMatchInput): Promise<FaceMatchOutput> {
  return faceMatchFlow(input);
}

const faceMatchPrompt = ai.definePrompt({
  name: 'faceMatchPrompt',
  input: {schema: FaceMatchInputSchema},
  output: {schema: FaceMatchOutputSchema},
  prompt: `You are an AI-powered face matching system.

You are given a photo of a person of interest and a frame from a live camera feed.

Determine if the person of interest is present in the live camera feed.

Return a confidence score (0-1) indicating the likelihood of a match. If no match is found, return matchFound as false.

Person of Interest Photo: {{media url=personOfInterestPhotoDataUri}}
Live Camera Feed: {{media url=liveFeedDataUri}}

Output in JSON format:
{
  "matchFound": boolean,
  "confidenceScore": number (0-1), or null if no match,
  "timestamp": string, ISO date time format, only if a match is found, otherwise null.
}
`,
});

const faceMatchFlow = ai.defineFlow(
  {
    name: 'faceMatchFlow',
    inputSchema: FaceMatchInputSchema,
    outputSchema: FaceMatchOutputSchema,
  },
  async input => {
    const {output} = await faceMatchPrompt(input);
    //add the timestamp to the output
    if (output?.matchFound) {
      output.timestamp = new Date().toISOString();
    } else {
        // ensure timestamp is not present if no match
        if (output) {
            delete output.timestamp;
        }
    }
    return output!;
  }
);
