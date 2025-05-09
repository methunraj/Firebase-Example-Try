'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { Example } from '@/types';

const defaultSystemPrompt = `You are a precise data extraction assistant. Your task is to extract structured information from documents according to the provided JSON schema. 
Always return valid JSON that matches the schema exactly. 
If information for a field is not available in the document, use null for that field, unless the schema specifies otherwise (e.g., a default value or if the field is not nullable).
Focus solely on extracting data as per the schema. Do not add any conversational fluff or explanations outside of the JSON output.`;

const defaultUserPromptTemplate = `Based on the provided document content and the JSON schema, please extract the relevant information.

Document Content will be provided by the system.
JSON Schema will be provided by the system.

Your task is to meticulously analyze the document and populate the fields defined in the JSON schema.
Return ONLY the valid JSON output that conforms to the schema.`;


interface PromptContextType {
  systemPrompt: string;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  userPromptTemplate: string;
  setUserPromptTemplate: Dispatch<SetStateAction<string>>;
  examples: Example[];
  setExamples: Dispatch<SetStateAction<Example[]>>;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState<string>(defaultUserPromptTemplate);
  const [examples, setExamples] = useState<Example[]>([]);

  const value = useMemo(() => ({
    systemPrompt, setSystemPrompt,
    userPromptTemplate, setUserPromptTemplate,
    examples, setExamples
  }), [systemPrompt, userPromptTemplate, examples]);

  return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}

export function usePrompts() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
}
