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
    .nullable()
    .describe('The confidence score of the match (0-1), or null if no match was found.'),
  timestamp: z.string().optional().describe('The ISO 8601 timestamp of when the match occurred, or null if no match was found.'),
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

Your task is to determine if the person of interest is present in the live camera feed.

Carefully analyze the facial features in both images.

If a match is found:
- Set 'matchFound' to true.
- Provide a confidence score between 0 and 1 indicating the likelihood of the match.
- Set the 'timestamp' to the current time in ISO 8601 format.

If no match is found:
- Set 'matchFound' to false.
- Set 'confidenceScore' to null.
- Set 'timestamp' to null.

Person of Interest Photo: {{media url=personOfInterestPhotoDataUri}}
Live Camera Feed: {{media url=liveFeedDataUri}}
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
    
    if (output?.matchFound) {
      // Ensure timestamp is set if a match is found. If AI didn't provide one, set it now.
      if (!output.timestamp) {
          output.timestamp = new Date().toISOString();
      }
    } else if (output) {
      // Ensure timestamp is null if no match is found
      output.timestamp = undefined;
      output.confidenceScore = null;
    }
    
    return output!;
  }
);
