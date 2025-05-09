
'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { visualizeThinking } from '@/ai/flows/visualize-thinking';
import { Loader2, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ThinkingBudget } from '@/contexts/JobContext';

export function ThinkingVisualizerForm() {
  const [query, setQuery] = useState('');
  const [detailLevel, setDetailLevel] = useState<ThinkingBudget>('standard');
  const [thinkingProcess, setThinkingProcess] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleVisualize = () => {
    if (!query.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a query or prompt to visualize.',
        variant: 'destructive',
      });
      return;
    }
    setThinkingProcess(''); 
    startTransition(async () => {
      try {
        const result = await visualizeThinking({ query, detailLevel });
        setThinkingProcess(result.thinkingProcess);
        toast({
          title: 'Visualization Complete',
          description: "The AI's thinking process has been generated.",
        });
      } catch (error) {
        console.error('Thinking visualization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not visualize thinking process.';
        setThinkingProcess(`Error: ${errorMessage}`);
        toast({
          title: 'Error',
          description: `An error occurred during thinking visualization: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="query-input" className="text-lg font-semibold">Query or Prompt</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Enter the text for which you want to visualize the AI&apos;s thinking process.
        </p>
        <Textarea
          id="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="e.g., Extract the key findings from the attached research paper abstract..."
          className="rounded-md shadow-sm"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-level" className="text-base font-semibold">Detail Level</Label>
        <Select value={detailLevel} onValueChange={(value) => setDetailLevel(value as ThinkingBudget)} disabled={isPending}>
          <SelectTrigger id="detail-level" className="w-full sm:w-[200px] rounded-md shadow-sm">
            <SelectValue placeholder="Select detail level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brief">Brief</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
          </SelectContent>
        </Select>
      </div>


      <Button onClick={handleVisualize} disabled={isPending || !query.trim()} className="w-full sm:w-auto">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Eye className="mr-2 h-4 w-4" />
        )}
        Visualize Thinking
      </Button>

      { (isPending || thinkingProcess) && (
        <div>
          <Label className="text-lg font-semibold">Thinking Process</Label>
          <ScrollArea className="h-96 mt-2 w-full rounded-md border p-4 bg-muted/30 shadow-inner">
            {isPending && !thinkingProcess && <p className="text-muted-foreground">Visualizing... please wait.</p>}
            <pre className="whitespace-pre-wrap text-sm font-mono break-words">
              {thinkingProcess}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
