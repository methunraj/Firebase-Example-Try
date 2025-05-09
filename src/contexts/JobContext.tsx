'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { JobResult } from '@/types';

export type ThinkingBudget = 'brief' | 'standard' | 'detailed';

interface JobContextType {
  jobResults: JobResult[];
  addJobResult: (result: JobResult) => void;
  clearJobResults: () => void;
  isExtracting: boolean;
  setIsExtracting: Dispatch<SetStateAction<boolean>>;
  thinkingEnabled: boolean;
  setThinkingEnabled: Dispatch<SetStateAction<boolean>>;
  thinkingBudget: ThinkingBudget;
  setThinkingBudget: Dispatch<SetStateAction<ThinkingBudget>>;
  progress: number; // Overall progress 0-100
  setProgress: Dispatch<SetStateAction<number>>;
  currentTask: string;
  setCurrentTask: Dispatch<SetStateAction<string>>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [thinkingEnabled, setThinkingEnabled] = useState<boolean>(false);
  const [thinkingBudget, setThinkingBudget] = useState<ThinkingBudget>('standard');
  const [progress, setProgress] = useState<number>(0);
  const [currentTask, setCurrentTask] = useState<string>('');

  const addJobResult = useCallback((result: JobResult) => {
    setJobResults(prevResults => [...prevResults, result]);
  }, []);
  
  const clearJobResults = useCallback(() => {
    setJobResults([]);
  }, []);

  const value = useMemo(() => ({
    jobResults, addJobResult, clearJobResults,
    isExtracting, setIsExtracting,
    thinkingEnabled, setThinkingEnabled,
    thinkingBudget, setThinkingBudget,
    progress, setProgress,
    currentTask, setCurrentTask,
  }), [jobResults, addJobResult, clearJobResults, isExtracting, thinkingEnabled, thinkingBudget, progress, currentTask]);

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJob() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
}
