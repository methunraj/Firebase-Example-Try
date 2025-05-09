export interface Example {
  input: string;
  output: string;
}

export interface AppFile {
  id: string;
  name: string;
  type: string; // Mime type
  size: number;
  dataUri: string;
  textContent?: string; // Extracted text content if applicable
}

export interface JobResult {
  fileName: string;
  extractedData: string | null;
  thinkingProcess?: string | null;
  error?: string;
  timestamp: number;
}
