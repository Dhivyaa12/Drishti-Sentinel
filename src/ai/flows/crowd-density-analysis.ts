// Implemented crowd density analysis flow.

'use server';

/**
 * @fileOverview A crowd density analysis AI agent.
 *
 * - analyzeCrowdDensity - A function that handles the crowd density analysis process.
 * - AnalyzeCrowdDensityInput - The input type for the analyzeCrowdDensity function.
 * - AnalyzeCrowdDensityOutput - The return type for the analyzeCrowdDensity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCrowdDensityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crowd, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  zoneDescription: z.string().describe('The description of the zone being analyzed.'),
});
export type AnalyzeCrowdDensityInput = z.infer<typeof AnalyzeCrowdDensityInputSchema>;

const AnalyzeCrowdDensityOutputSchema = z.object({
  headCount: z.number().describe('The number of people detected in the image.'),
  densityLevel: z
    .string()
    .describe(
      'The crowd density level, which can be low, medium, or high, based on the head count.'
    ),
  report: z.string().describe('A detailed report of the crowd density analysis.'),
});
export type AnalyzeCrowdDensityOutput = z.infer<typeof AnalyzeCrowdDensityOutputSchema>;

export async function analyzeCrowdDensity(
  input: AnalyzeCrowdDensityInput
): Promise<AnalyzeCrowdDensityOutput> {
  return analyzeCrowdDensityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCrowdDensityPrompt',
  input: {schema: AnalyzeCrowdDensityInputSchema},
  output: {schema: AnalyzeCrowdDensityOutputSchema},
  prompt: `You are a security expert analyzing crowd density in a specific zone.

You will receive an image of the zone and its description. Your task is to count the number of people in the image, determine the crowd density level (low, medium, or high), and generate a detailed report.

Consider the following factors when determining crowd density:

- The size of the zone
- The number of people present
- The activity level of the people

Use the following as the primary source of information about the crowd.

Zone Description: {{{zoneDescription}}}
Photo: {{media url=photoDataUri}}

Output the head count, density level, and a detailed report.
`,
});

const analyzeCrowdDensityFlow = ai.defineFlow(
  {
    name: 'analyzeCrowdDensityFlow',
    inputSchema: AnalyzeCrowdDensityInputSchema,
    outputSchema: AnalyzeCrowdDensityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
