
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Save, Loader2 } from 'lucide-react';
import { usePrompts } from '@/contexts/PromptContext';
import type { Example } from '@/types';
import { useToast } from '@/hooks/use-toast';


export function PromptEditorForm() {
  const { 
    systemPrompt: contextSystemPrompt, setSystemPrompt: setContextSystemPrompt,
    userPromptTemplate: contextUserPromptTemplate, setUserPromptTemplate: setContextUserPromptTemplate,
    examples: contextExamples, setExamples: setContextExamples
  } = usePrompts();

  const [localSystemPrompt, setLocalSystemPrompt] = useState(contextSystemPrompt);
  const [localUserPromptTemplate, setLocalUserPromptTemplate] = useState(contextUserPromptTemplate);
  const [localExamples, setLocalExamples] = useState<Example[]>(contextExamples);
  
  const [currentExampleInput, setCurrentExampleInput] = useState('');
  const [currentExampleOutput, setCurrentExampleOutput] = useState('');
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setLocalSystemPrompt(contextSystemPrompt);
  }, [contextSystemPrompt]);

  useEffect(() => {
    setLocalUserPromptTemplate(contextUserPromptTemplate);
  }, [contextUserPromptTemplate]);

  useEffect(() => {
    setLocalExamples(contextExamples);
  }, [contextExamples]);


  const addExample = () => {
    if (currentExampleInput.trim() && currentExampleOutput.trim()) {
      try {
        JSON.parse(currentExampleOutput); // Validate JSON
        setLocalExamples([...localExamples, { input: currentExampleInput, output: currentExampleOutput }]);
        setCurrentExampleInput('');
        setCurrentExampleOutput('');
        toast({ title: "Example Added", description: "Review and save prompts to persist."});
      } catch (error) {
        toast({ title: "Invalid JSON", description: "Example output must be valid JSON.", variant: "destructive" });
      }
    } else {
      toast({ title: "Missing Fields", description: "Both example input and output are required.", variant: "destructive" });
    }
  };

  const removeExample = (index: number) => {
    setLocalExamples(localExamples.filter((_, i) => i !== index));
    toast({ title: "Example Removed", description: "Review and save prompts to persist."});
  };

  const handleSavePrompts = () => {
    startSavingTransition(() => {
      setContextSystemPrompt(localSystemPrompt);
      setContextUserPromptTemplate(localUserPromptTemplate);
      setContextExamples(localExamples);
      toast({
        title: "Prompts Saved",
        description: "System prompt, user prompt template, and examples have been saved.",
      });
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="system-prompt" className="text-lg font-semibold">System Prompt</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Instructions defining the LLM&apos;s role, capabilities, and general behavior.
        </p>
        <Textarea
          id="system-prompt"
          value={localSystemPrompt}
          onChange={(e) => setLocalSystemPrompt(e.target.value)}
          rows={8}
          placeholder="Enter system prompt..."
          className="rounded-md shadow-sm"
          disabled={isSaving}
        />
      </div>

      <div>
        <Label htmlFor="user-prompt-template" className="text-lg font-semibold">User Prompt Template</Label>
        <p className="text-sm text-muted-foreground mb-2">
          {'Template for the prompt specific to each document. Use Handlebars placeholders like `{{document_content_text}}` (for text from the document) or `{{media url=document_media_url}}` (for direct media processing like images/PDFs), and `{{json_schema_text}}` (for the JSON schema definition). These will be resolved by the system during extraction.'}
        </p>
        <Textarea
          id="user-prompt-template"
          value={localUserPromptTemplate}
          onChange={(e) => setLocalUserPromptTemplate(e.target.value)}
          rows={12}
          placeholder="Enter user prompt template..."
          className="rounded-md shadow-sm"
          disabled={isSaving}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Few-shot Examples (Optional)</CardTitle>
          <CardDescription>Provide examples to guide the LLM for better accuracy on complex tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {localExamples.map((example, index) => (
            <Card key={index} className="bg-secondary/50">
              <CardHeader className="p-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Example {index + 1}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => removeExample(index)} disabled={isSaving}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div>
                  <Label htmlFor={`example-input-${index}`} className="text-sm font-medium">Input (Context/Document Snippet):</Label>
                  <Textarea id={`example-input-${index}`} value={example.input} readOnly rows={3} className="bg-background"/>
                </div>
                <div>
                  <Label htmlFor={`example-output-${index}`} className="text-sm font-medium">Output (Expected JSON):</Label>
                  <Textarea id={`example-output-${index}`} value={example.output} readOnly rows={3} className="font-mono bg-background"/>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-md font-semibold">Add New Example</Label>
            <div>
              <Label htmlFor="new-example-input" className="text-sm">Example Input:</Label>
              <Textarea
                id="new-example-input"
                value={currentExampleInput}
                onChange={(e) => setCurrentExampleInput(e.target.value)}
                placeholder="Paste example input text here..."
                rows={3}
                className="rounded-md shadow-sm"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="new-example-output" className="text-sm">Example Output (JSON):</Label>
              <Textarea
                id="new-example-output"
                value={currentExampleOutput}
                onChange={(e) => setCurrentExampleOutput(e.target.value)}
                placeholder='{ "key": "value" }'
                rows={3}
                className="font-mono rounded-md shadow-sm"
                disabled={isSaving}
              />
            </div>
            <Button onClick={addExample} variant="outline" size="sm" disabled={isSaving}>Add Example</Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSavePrompts} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Prompts
      </Button>
    </div>
  );
}
