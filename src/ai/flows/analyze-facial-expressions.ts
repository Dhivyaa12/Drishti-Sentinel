'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing facial expressions in real-time from camera feeds.
 *
 * It includes:
 * - analyzeFacialExpressions - A function to analyze facial expressions and trigger alerts based on emotion intensity.
 * - AnalyzeFacialExpressionsInput - The input type for the analyzeFacialExpressions function.
 * - AnalyzeFacialExpressionsOutput - The return type for the analyzeFacialExpressions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFacialExpressionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  zone: z.string().describe('The zone where the face was detected (e.g., Zone A, Zone B).'),
});
export type AnalyzeFacialExpressionsInput = z.infer<typeof AnalyzeFacialExpressionsInputSchema>;

const AnalyzeFacialExpressionsOutputSchema = z.object({
  dominantEmotion: z
    .string()
    .describe('The dominant emotion detected in the face (e.g., anger, fear, neutral).'),
  emotionIntensity: z
    .number()
    .describe('A numerical value (0-1) indicating the intensity of the dominant emotion.'),
  isStrongEmotion: z
    .boolean()
    .describe('Whether the detected emotion intensity exceeds a predefined threshold.'),
  description: z
    .string()
    .describe('Description of detected anomalies and risk level. If no threat is detected, provide a brief description of the scene.'),
  riskLevel: z.string().describe('Risk level associated with the detected emotions (Normal, Medium, High)'),
});
export type AnalyzeFacialExpressionsOutput = z.infer<typeof AnalyzeFacialExpressionsOutputSchema>;

export async function analyzeFacialExpressions(
  input: AnalyzeFacialExpressionsInput
): Promise<AnalyzeFacialExpressionsOutput> {
  return analyzeFacialExpressionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFacialExpressionsPrompt',
  input: {schema: AnalyzeFacialExpressionsInputSchema},
  output: {schema: AnalyzeFacialExpressionsOutputSchema},
  prompt: `You are a security expert analyzing facial expressions to detect potential threats.
  Analyze the provided facial expression and determine the dominant emotion, its intensity, and the associated risk level.

  Photo: {{media url=photoDataUri}}
  Zone: {{{zone}}}

  Based on the analysis, provide a description and assign a risk level (Normal, Medium, or High).
  Consider "anger" and "fear" as strong emotions that may indicate a potential issue. Set isStrongEmotion to true if these are detected.
  If no particular threat is detected, provide a brief, one-sentence description of the scene in the "description" field.

  Format your output as a JSON object matching the following schema:
  ${JSON.stringify(AnalyzeFacialExpressionsOutputSchema.describe())}
  `,
});

const analyzeFacialExpressionsFlow = ai.defineFlow(
  {
    name: 'analyzeFacialExpressionsFlow',
    inputSchema: AnalyzeFacialExpressionsInputSchema,
    outputSchema: AnalyzeFacialExpressionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);