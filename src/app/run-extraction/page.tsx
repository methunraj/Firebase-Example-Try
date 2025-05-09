
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle, Settings2, FileText, BrainCircuit, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useSchema } from "@/contexts/SchemaContext";
import { usePrompts } from "@/contexts/PromptContext";
import { useLLMConfig } from "@/contexts/LLMContext";
import { useFiles } from "@/contexts/FileContext";
import { useJob, type ThinkingBudget } from "@/contexts/JobContext";
import { useToast } from "@/hooks/use-toast";
import { extractData, type ExtractDataInput } from "@/ai/flows/extract-data-flow";
import { visualizeThinking, type VisualizeThinkingInput } from "@/ai/flows/visualize-thinking";
import type { AppFile, JobResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown'; // For rendering thinking process
import { formatDistanceToNow } from 'date-fns';


export default function RunExtractionPage() {
  const { schemaJson } = useSchema();
  const { systemPrompt, userPromptTemplate, examples } = usePrompts();
  const { provider, model, apiKey } = useLLMConfig();
  const { files } = useFiles();
  const { 
    jobResults, addJobResult, clearJobResults,
    isExtracting, setIsExtracting,
    thinkingEnabled, setThinkingEnabled,
    thinkingBudget, setThinkingBudget,
    progress, setProgress,
    currentTask, setCurrentTask
  } = useJob();
  const { toast } = useToast();

  const handleStartExtraction = async () => {
    if (files.length === 0) {
      toast({ title: "No Files", description: "Please select files for extraction in File Management.", variant: "destructive" });
      return;
    }
    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Please configure your LLM API key in LLM Configuration.", variant: "destructive" });
      return;
    }

    setIsExtracting(true);
    clearJobResults();
    setProgress(0);
    
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setCurrentTask(`Processing ${file.name} (${i + 1}/${totalFiles})...`);
      setProgress(Math.round(((i) / totalFiles) * 100));

      let extractedDataJson: string | null = null;
      let thinkingProcess: string | null = null;
      let errorMsg: string | undefined;

      try {
        // Main extraction
        const extractionInput: ExtractDataInput = {
          documentFile: {
            name: file.name,
            type: file.type,
            dataUri: file.dataUri,
            textContent: file.textContent,
          },
          schemaDefinition: schemaJson,
          systemPrompt: systemPrompt,
          userTaskDescription: userPromptTemplate, // This is the user's prompt template
          examples: examples,
        };
        
        const extractionOutput = await extractData(extractionInput);
        extractedDataJson = extractionOutput.extractedJson;

        // Conditional thinking visualization
        if (thinkingEnabled) {
          setCurrentTask(`Visualizing thinking for ${file.name}...`);
          // Construct a query for visualizeThinking. This might be the user prompt + a reference to the doc.
          const thinkingQuery = `Task: ${userPromptTemplate}\nSchema: ${schemaJson.substring(0, 100)}...\nDocument: ${file.name} (${file.type})`;
          const visualizeInput: VisualizeThinkingInput = { 
            query: thinkingQuery, 
            detailLevel: thinkingBudget 
          };
          const thinkingOutput = await visualizeThinking(visualizeInput);
          thinkingProcess = thinkingOutput.thinkingProcess;
        }
         toast({ title: "Extraction Successful", description: `Successfully extracted data from ${file.name}.` });
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        errorMsg = err instanceof Error ? err.message : "An unknown error occurred.";
        toast({ title: "Extraction Error", description: `Failed to process ${file.name}: ${errorMsg}`, variant: "destructive" });
      }

      addJobResult({
        fileName: file.name,
        extractedData: extractedDataJson,
        thinkingProcess: thinkingProcess,
        error: errorMsg,
        timestamp: Date.now(),
      });
    }
    
    setProgress(100);
    setCurrentTask(totalFiles > 0 ? "All files processed." : "No files to process.");
    setIsExtracting(false);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Run Extraction Job</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiate Data Extraction</CardTitle>
          <CardDescription>
            Combine your defined schema, prompts, selected files, and LLM settings, then start the process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4 p-6 border rounded-lg bg-background shadow">
            <h2 className="text-xl font-semibold flex items-center"><Settings2 className="mr-2 h-6 w-6 text-primary" />Configuration Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2"><strong className="text-muted-foreground">Schema:</strong> {schemaJson ? <Badge variant="secondary">Defined</Badge> : <Badge variant="destructive">Not Defined</Badge>}</div>
                <div className="flex items-center gap-2 mt-1"><strong className="text-muted-foreground">Prompts:</strong> {systemPrompt && userPromptTemplate ? <Badge variant="secondary">Configured</Badge> : <Badge variant="destructive">Not Configured</Badge>}</div>
              </div>
              <div>
                <p><strong className="text-muted-foreground">Files:</strong> {files.length} selected</p>
                <div className="flex items-center gap-2 mt-1"><strong className="text-muted-foreground">LLM:</strong> {provider} / {model} {apiKey ? <Badge variant="secondary">Key Set</Badge> : <Badge variant="destructive">No API Key</Badge>}</div>
              </div>
            </div>
          </section>

          <section className="space-y-4 p-6 border rounded-lg bg-background shadow">
            <h2 className="text-xl font-semibold flex items-center"><PlayCircle className="mr-2 h-6 w-6 text-primary" />Job Controls</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="thinking-enabled"
                  checked={thinkingEnabled}
                  onCheckedChange={setThinkingEnabled}
                  disabled={isExtracting}
                />
                <Label htmlFor="thinking-enabled">Enable AI Thinking Visualization</Label>
              </div>
              {thinkingEnabled && (
                <div className="w-full sm:w-auto">
                  <Label htmlFor="thinking-budget" className="text-sm">Thinking Detail</Label>
                  <Select 
                    value={thinkingBudget} 
                    onValueChange={(value) => setThinkingBudget(value as ThinkingBudget)}
                    disabled={isExtracting}
                  >
                    <SelectTrigger id="thinking-budget" className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select detail level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Brief</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button size="lg" className="w-full md:w-auto mt-4" onClick={handleStartExtraction} disabled={isExtracting || files.length === 0 || !apiKey}>
              {isExtracting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
              {isExtracting ? 'Processing...' : `Start Extraction (${files.length} file${files.length === 1 ? '' : 's'})`}
            </Button>
            {isExtracting && (
              <div className="mt-4 space-y-2">
                <Label>{currentTask}</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </section>
          
          {jobResults.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Extraction Results</h2>
              <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              {jobResults.slice().reverse().map((result, index) => (
                <Card key={index} className="mb-4 bg-secondary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {result.error ? <AlertCircle className="mr-2 h-5 w-5 text-destructive" /> : <CheckCircle className="mr-2 h-5 w-5 text-green-500" />}
                        {result.fileName}
                      </div>
                       <span className="text-xs text-muted-foreground font-normal">
                        {formatDistanceToNow(result.timestamp, { addSuffix: true })}
                      </span>
                    </CardTitle>
                    {result.error && (
                       <Alert variant="destructive" className="mt-2">
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{result.error}</AlertDescription>
                       </Alert>
                    )}
                  </CardHeader>
                  {result.extractedData && (
                    <CardContent>
                      <Label className="text-base font-semibold">Extracted Data (JSON)</Label>
                      <ScrollArea className="h-48 mt-1 w-full rounded-md border bg-background p-2 shadow-inner">
                        <pre className="whitespace-pre-wrap text-xs font-mono break-words">
                          {result.extractedData}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  )}
                  {result.thinkingProcess && (
                    <CardContent>
                       <Label className="text-base font-semibold flex items-center"><BrainCircuit className="mr-2 h-5 w-5 text-accent" />AI Thinking Process</Label>
                       <ScrollArea className="h-64 mt-1 w-full rounded-md border bg-background p-2 shadow-inner">
                         <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-xs break-words">
                           {result.thinkingProcess}
                         </ReactMarkdown>
                       </ScrollArea>
                    </CardContent>
                  )}
                   {!result.extractedData && !result.thinkingProcess && !result.error && (
                     <CardContent>
                       <Alert variant="default">
                         <Info className="h-4 w-4" />
                         <AlertTitle>Processing Information</AlertTitle>
                         <AlertDescription>No data or thinking process to display for this file, or an issue occurred.</AlertDescription>
                       </Alert>
                     </CardContent>
                   )}
                </Card>
              ))}
              </ScrollArea>
              <Button variant="outline" onClick={clearJobResults} disabled={isExtracting}>Clear Results</Button>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

