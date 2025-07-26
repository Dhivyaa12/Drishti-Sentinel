'use server';

/**
 * @fileOverview This file defines a Genkit flow for detecting anomalies in live camera feeds.
 *
 * The flow takes a camera feed as input and uses Google Gemini to identify anomalies such as fire,
 * loitering, fights, and panic. The flow returns a list of detected anomalies with their descriptions.
 *
 * @fileExport detectAnomalies - A function that takes a camera feed URL and returns a list of detected anomalies.
 * @fileExport DetectAnomaliesInput - The input type for the detectAnomalies function.
 * @fileExport DetectAnomaliesOutput - The output type for the detectAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAnomaliesInputSchema = z.object({
  cameraFeedDataUri: z
    .string()
    .describe(
      "A camera feed as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  zone: z.string().describe('The zone where the camera is located.'),
});
export type DetectAnomaliesInput = z.infer<typeof DetectAnomaliesInputSchema>;

const AnomalySchema = z.object({
  type: z.string().describe('The type of anomaly detected (e.g., fire, loitering, fight, panic).'),
  description: z.string().describe('A detailed description of the anomaly.'),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('The risk level of the anomaly.'),
  timestamp: z.string().describe('The timestamp when the anomaly was detected (ISO format).'),
  location: z.string().describe('The geographic location of the event.'),
});

const DetectAnomaliesOutputSchema = z.object({
  anomalies: z.array(AnomalySchema).describe('A list of detected anomalies.'),
});

export type DetectAnomaliesOutput = z.infer<typeof DetectAnomaliesOutputSchema>;

export async function detectAnomalies(input: DetectAnomaliesInput): Promise<DetectAnomaliesOutput> {
  return detectAnomaliesFlow(input);
}

const analyzeFrameTool = ai.defineTool({
  name: 'analyzeFrame',
  description: 'Analyzes a single frame from a camera feed to detect potential security anomalies.',
  inputSchema: z.object({
    frameDataUri: z
      .string()
      .describe(
        "A single frame from the camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    zone: z.string().describe('The zone where the camera is located.'),
  }),
  outputSchema: z.array(AnomalySchema),
  async fn(input) {
    // Mock implementation - replace with actual anomaly detection logic
    console.log('Analyzing frame for anomalies...', input.zone);
    return []; // Return an empty array if no anomalies are detected in this frame
  },
});

const shouldAnalyzeTool = ai.defineTool({
  name: 'shouldAnalyze',
  description: 'Determines whether a frame from the camera feed should be analyzed for anomalies based on recent activity.',
  inputSchema: z.object({
    recentActivity: z.string().describe('A summary of recent activity in the camera feed.'),
  }),
  outputSchema: z.boolean().describe('Whether the frame should be analyzed (true) or not (false).'),
  async fn(input) {
    // Mock implementation - replace with actual logic to determine if analysis is needed
    console.log('Checking if frame analysis is needed based on recent activity...');
    return true; // Always return true for now, indicating analysis is needed
  },
});

const detectAnomaliesPrompt = ai.definePrompt({
  name: 'detectAnomaliesPrompt',
  input: {schema: DetectAnomaliesInputSchema},
  output: {schema: DetectAnomaliesOutputSchema},
  tools: [analyzeFrameTool, shouldAnalyzeTool],
  prompt: `You are an AI-powered security system analyzing live camera feeds for anomalies.

  You will receive a camera feed from a specific zone. Your task is to identify any security-related anomalies, such as fire, loitering, fights, or panic.

  Here are the steps you should follow:
  1.  Use the shouldAnalyze tool to determine if the current frame needs to be analyzed based on recent activity.
  2.  If analysis is needed, use the analyzeFrame tool to analyze the frame and identify any anomalies.
  3.  Return a list of detected anomalies, including their type, description, risk level (low, medium, high, critical), timestamp, and location.

  Input Camera Feed: {{media url=cameraFeedDataUri}}
  Zone: {{{zone}}}

  Output Format: JSON array of anomalies. Each anomaly should include: type, description, riskLevel, timestamp, and location.
  `,
});

const detectAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectAnomaliesFlow',
    inputSchema: DetectAnomaliesInputSchema,
    outputSchema: DetectAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await detectAnomaliesPrompt(input);
    return output!;
  }
);
