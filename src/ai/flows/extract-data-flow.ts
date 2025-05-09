
'use server';
/**
 * @fileOverview A Genkit flow for extracting structured data from documents.
 *
 * - extractData - A function that handles the data extraction process.
 * - ExtractDataInput - The input type for the extractData function.
 * - ExtractDataOutput - The return type for the extractData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { AppFile, Example } from '@/types'; // Assuming types are defined here

// Input schema for the flow itself (wrapper function)
const ExtractDataInputSchema = z.object({
  documentFile: z.object({
    name: z.string(),
    type: z.string(), // Mime type
    dataUri: z.string().describe("Document as data URI. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    textContent: z.string().optional().describe("Extracted text content if applicable, otherwise the LLM will process the dataUri directly (e.g., for images/PDFs)."),
  }),
  schemaDefinition: z.string().describe("The JSON schema for extraction (as a string)."),
  systemPrompt: z.string().describe("The system prompt for the LLM."),
  userTaskDescription: z.string().describe("User's specific instruction/task for this extraction (this is typically the user prompt template from the UI)."),
  examples: z.array(z.object({ input: z.string().describe("Example input context or document snippet."), output: z.string().describe("Example JSON output.") })).optional().describe("Few-shot examples."),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

// Output schema for the flow
const ExtractDataOutputSchema = z.object({
  extractedJson: z.string().describe("The extracted data as a JSON string, conforming to the provided schema."),
});
export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

// Schema for the data that will be directly available to the Handlebars prompt template
const GenkitPromptContextSchema = z.object({
  system_prompt_text: z.string(),
  user_task_text: z.string(),
  document_content_text: z.string().optional(), // Text content if available
  document_media_url: z.string(),             // Always provide data URI for {{media}} helper
  json_schema_text: z.string(),
  examples_list: z.array(z.object({ input: z.string(), output: z.string() })).optional(),
});

const extractionPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: GenkitPromptContextSchema },
  output: { schema: ExtractDataOutputSchema },
  prompt: `{{{system_prompt_text}}}

User Task: {{{user_task_text}}}

Document to process:
{{#if document_content_text}}
{{{document_content_text}}}
{{else}}
{{media url=document_media_url}}
{{/if}}

JSON Schema for extraction:
\`\`\`json
{{{json_schema_text}}}
\`\`\`

{{#if examples_list.length}}
Here are some examples to guide you:
{{#each examples_list}}
---
Example Input Context:
{{{this.input}}}
Expected JSON Output:
{{{this.output}}}
---
{{/each}}
{{/if}}

Based on the user task, document, and JSON schema, extract the relevant information.
Return ONLY the valid JSON output that conforms to the schema. Do not include any other text, explanations, or markdown code fences around the JSON.`,
  // Configure the model directly in the prompt if needed, or rely on global config
  // model: 'gemini-1.5-flash-latest', 
  config: {
    temperature: 0.2, // Lower temperature for more deterministic extraction
    safetySettings: [ // Example: Adjust safety settings if needed
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE'},
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
    ]
  },
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    const promptData: z.infer<typeof GenkitPromptContextSchema> = {
      system_prompt_text: input.systemPrompt,
      user_task_text: input.userTaskDescription,
      document_content_text: input.documentFile.textContent,
      document_media_url: input.documentFile.dataUri,
      json_schema_text: input.schemaDefinition,
      examples_list: input.examples,
    };

    const { output } = await extractionPrompt(promptData);
    
    if (!output) {
      throw new Error("Extraction failed: No output from LLM.");
    }
    
    // Basic validation: is it JSON?
    try {
      JSON.parse(output.extractedJson);
    } catch (e) {
      // Attempt to fix common LLM mistake of wrapping JSON in markdown
      const fixedJson = output.extractedJson.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      try {
        JSON.parse(fixedJson);
        return { extractedJson: fixedJson };
      } catch (e2) {
         console.error("LLM output is not valid JSON:", output.extractedJson);
         // Consider re-prompting or returning an error structure
         throw new Error(`Extraction failed: LLM output is not valid JSON. Error: ${(e as Error).message}`);
      }
    }
    
    return output; // output is already conforming to ExtractDataOutputSchema
  }
);
