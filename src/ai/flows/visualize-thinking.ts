
'use server';

/**
 * @fileOverview A flow that visualizes the model's thinking process for better insights into complex extractions.
 *
 * - visualizeThinking - A function that enables visualizing the model's thinking process.
 * - VisualizeThinkingInput - The input type for the visualizeThinking function.
 * - VisualizeThinkingOutput - The return type for the visualizeThinking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ThinkingBudget } from '@/contexts/JobContext'; // Assuming type is here

const VisualizeThinkingInputSchema = z.object({
  query: z.string().describe('The query or prompt for which to visualize the thinking process.'),
  detailLevel: z.enum(['brief', 'standard', 'detailed']).optional().describe('The desired level of detail for the thinking process visualization.'),
});
export type VisualizeThinkingInput = z.infer<typeof VisualizeThinkingInputSchema>;

const VisualizeThinkingOutputSchema = z.object({
  thinkingProcess: z.string().describe('The visualized thinking process of the model.'),
});
export type VisualizeThinkingOutput = z.infer<typeof VisualizeThinkingOutputSchema>;

export async function visualizeThinking(input: VisualizeThinkingInput): Promise<VisualizeThinkingOutput> {
  return visualizeThinkingFlow(input);
}

const visualizeThinkingPrompt = ai.definePrompt({
  name: 'visualizeThinkingPrompt',
  input: {schema: VisualizeThinkingInputSchema},
  output: {schema: VisualizeThinkingOutputSchema},
  prompt: `You are an AI assistant that explains the thinking process of another AI model.
For the following query:
"{{{query}}}"

{{#if detailLevel}}
Provide a {{detailLevel}} explanation of the steps and reasoning the model likely takes to arrive at an answer related to this query.
{{else}}
Explain the steps and reasoning the model likely takes to arrive at an answer related to this query.
{{/if}}

Focus on clarity and logical flow. If the query implies a task (e.g., data extraction), describe how the model might break down the task, identify relevant information, and structure the output.
If the query is about a concept, explain how the model might access and synthesize information.
`,
  config: {
    temperature: 0.5, // Allow for more descriptive explanations
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
    ]
  },
});

const visualizeThinkingFlow = ai.defineFlow(
  {
    name: 'visualizeThinkingFlow',
    inputSchema: VisualizeThinkingInputSchema,
    outputSchema: VisualizeThinkingOutputSchema,
  },
  async (input) => {
    const {output} = await visualizeThinkingPrompt(input);
    if (!output) {
      throw new Error("Thinking visualization failed: No output from LLM.");
    }
    return output;
  }
);
