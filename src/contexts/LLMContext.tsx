'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

interface LLMContextType {
  provider: string;
  setProvider: Dispatch<SetStateAction<string>>;
  apiKey: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
  isKeyValid: boolean | null;
  setIsKeyValid: Dispatch<SetStateAction<boolean | null>>;
  availableModels: Record<string, string[]>;
}

const defaultAvailableModels: Record<string, string[]> = {
  googleAI: [
    'gemini-1.5-flash-latest', 
    'gemini-1.5-pro-latest', 
    'gemini-1.0-pro',
    'gemini-2.0-flash-exp', // for potential image generation features
    ],
  // Example for OpenAI if added later
  // openAI: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export function LLMProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState('googleAI');
  const [apiKey, setApiKey] = useState('');
  // Default model should align with the global Genkit config or be selectable.
  const [model, setModel] = useState(defaultAvailableModels['googleAI'][0]); 
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);

  const value = useMemo(() => ({
    provider, setProvider,
    apiKey, setApiKey,
    model, setModel,
    isKeyValid, setIsKeyValid,
    availableModels: defaultAvailableModels
  }), [provider, apiKey, model, isKeyValid]);

  return <LLMContext.Provider value={value}>{children}</LLMContext.Provider>;
}

export function useLLMConfig() {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useLLMConfig must be used within an LLMProvider');
  }
  return context;
}
