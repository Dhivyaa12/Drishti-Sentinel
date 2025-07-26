'use server';

/**
 * @fileOverview A Genkit flow for initiating an emergency call.
 * This is a mock implementation and does not actually place a call.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmergencyCallInputSchema = z.object({
  eventDescription: z.string().describe('A summary of the event triggering the call.'),
});
export type EmergencyCallInput = z.infer<typeof EmergencyCallInputSchema>;

const EmergencyCallOutputSchema = z.object({
  status: z.string().describe('The status of the emergency call attempt.'),
  confirmationNumber: z.string().optional().describe('A confirmation number for the call.'),
});
export type EmergencyCallOutput = z.infer<typeof EmergencyCallOutputSchema>;

// This is a mock tool. In a real application, this would integrate with a service like Twilio.
const initiatePhoneCallTool = ai.defineTool({
    name: 'initiatePhoneCall',
    description: 'Initiates a phone call to a pre-configured emergency number (9597428005).',
    inputSchema: z.object({
        reason: z.string().describe('The reason for the emergency call, which will be read out.'),
    }),
    outputSchema: z.object({
        callSid: z.string().describe('The unique identifier for the call attempt.'),
        status: z.enum(['queued', 'failed', 'initiated']).describe('The status of the call initiation.')
    }),
    async fn(input) {
        console.log(`MOCK_CALL_SERVICE: Calling 9597428005. Reason: ${input.reason}`);
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const callSid = `call_${Math.random().toString(36).substring(2)}`;
        console.log(`MOCK_CALL_SERVICE: Call initiated with SID: ${callSid}`);
        return { callSid, status: 'initiated' };
    },
});

const emergencyCallFlow = ai.defineFlow(
  {
    name: 'emergencyCallFlow',
    inputSchema: EmergencyCallInputSchema,
    outputSchema: EmergencyCallOutputSchema,
  },
  async (input) => {
    console.log(`Starting emergency call flow for event: ${input.eventDescription}`);
    
    const callResult = await initiatePhoneCallTool({ reason: input.eventDescription });

    if (callResult.status === 'initiated') {
      return {
        status: `Successfully initiated emergency call to 9597428005.`,
        confirmationNumber: callResult.callSid,
      };
    } else {
       return {
        status: `Failed to initiate emergency call. Status: ${callResult.status}`,
      };
    }
  }
);


export async function makeEmergencyCall(input: EmergencyCallInput): Promise<EmergencyCallOutput> {
    return emergencyCallFlow(input);
}
