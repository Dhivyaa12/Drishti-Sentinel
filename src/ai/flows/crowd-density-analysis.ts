
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing crowd density from camera feeds.
 *
 * It includes:
 * - analyzeCrowdDensity - A function to analyze an image and count the number of people.
 * - CrowdDensityAnalysisInput - The input type for the analyzeCrowdDensity function.
 * - CrowdDensityAnalysisOutput - The return type for the analyzeCrowdDensity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CrowdDensityAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  zone: z.string().describe('The zone where the image was captured (e.g., Zone A, Zone B).'),
});
export type CrowdDensityAnalysisInput = z.infer<typeof CrowdDensityAnalysisInputSchema>;

const CrowdDensityAnalysisOutputSchema = z.object({
  headCount: z.number().describe('The number of human heads detected in the image.'),
  densityCategory: z
    .enum(['Low', 'Medium', 'High'])
    .describe('The categorized crowd density (Low, Medium, or High).'),
  description: z.string().describe('A brief description of the crowd analysis findings.'),
});
export type CrowdDensityAnalysisOutput = z.infer<typeof CrowdDensityAnalysisOutputSchema>;

export async function analyzeCrowdDensity(
  input: CrowdDensityAnalysisInput
): Promise<CrowdDensityAnalysisOutput> {
  return crowdDensityAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crowdDensityAnalysisPrompt',
  input: {schema: CrowdDensityAnalysisInputSchema},
  output: {schema: CrowdDensityAnalysisOutputSchema},
  prompt: `You are a security AI that specializes in crowd density analysis.
Your task is to analyze the provided image and count the number of human heads to determine the crowd density for the specified zone.

Image: {{media url=photoDataUri}}
Zone: {{{zone}}}

Guidelines:
1.  Count the number of heads visible in the image. This is your 'headCount'.
2.  Categorize the density based on the head count:
    - Low: 2 or fewer heads.
    - Medium: 3 to 6 heads.
    - High: more than 6 heads.
3.  Provide a brief, one-sentence description summarizing your findings, including the head count and density level.

Format your output as a JSON object matching the following schema:
${JSON.stringify(CrowdDensityAnalysisOutputSchema.describe())}
`,
});

const crowdDensityAnalysisFlow = ai.defineFlow(
  {
    name: 'crowdDensityAnalysisFlow',
    inputSchema: CrowdDensityAnalysisInputSchema,
    outputSchema: CrowdDensityAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
