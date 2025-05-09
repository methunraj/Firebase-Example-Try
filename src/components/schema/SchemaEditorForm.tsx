'use client';

import { useState, useTransition, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateSchema } from '@/ai/flows/schema-definition-ui';
import { Loader2, Sparkles, Save } from 'lucide-react';
import { useSchema } from '@/contexts/SchemaContext';

export function SchemaEditorForm() {
  const { schemaJson, setSchemaJson: setContextSchemaJson } = useSchema();
  const [localSchemaJson, setLocalSchemaJson] = useState(schemaJson);
  const [intent, setIntent] = useState('');
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setLocalSchemaJson(schemaJson);
  }, [schemaJson]);

  const handleGenerateSchema = () => {
    if (!intent.trim()) {
      toast({
        title: 'Intent Required',
        description: 'Please enter your intent for schema generation.',
        variant: 'destructive',
      });
      return;
    }
    startGenerationTransition(async () => {
      try {
        const result = await generateSchema({ intent });
        if (result.schema) {
          try {
            const parsedSchema = JSON.parse(result.schema);
            setLocalSchemaJson(JSON.stringify(parsedSchema, null, 2));
            toast({
              title: 'Schema Generated',
              description: 'AI has successfully generated a schema. Review and save.',
            });
          } catch (parseError) {
            setLocalSchemaJson(result.schema);
            toast({
              title: 'Schema Generated (with formatting issue)',
              description: 'AI generated a schema, but it might not be perfectly formatted JSON. Please review and save.',
              variant: 'default'
            });
          }
        } else {
          toast({
            title: 'Generation Failed',
            description: 'AI could not generate a schema. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Schema generation error:', error);
        toast({
          title: 'Error',
          description: 'An error occurred during schema generation.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSaveSchema = () => {
    startSavingTransition(() => {
      try {
        // Validate JSON format before saving to context
        JSON.parse(localSchemaJson);
        setContextSchemaJson(localSchemaJson);
        toast({
          title: 'Schema Saved',
          description: 'The schema has been successfully saved.',
        });
      } catch (error) {
        toast({
          title: 'Invalid JSON',
          description: 'The schema is not valid JSON. Please correct it before saving.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSchemaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSchemaJson(event.target.value);
  };

  const isBusy = isGenerating || isSaving;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="intent" className="text-lg font-semibold">Describe your Schema Intent</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Tell the AI what kind of data you want to extract, and it will try to generate a JSON schema for you.
        </p>
        <div className="flex gap-2">
          <Input
            id="intent"
            placeholder="e.g., Extract names, emails, and job titles from resumes"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="flex-grow"
            disabled={isBusy}
          />
          <Button onClick={handleGenerateSchema} disabled={isBusy || !intent.trim()}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate with AI
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="schema-json" className="text-lg font-semibold">JSON Schema</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Edit the JSON schema directly below. This schema will guide the LLM in extracting data.
        </p>
        <Textarea
          id="schema-json"
          value={localSchemaJson}
          onChange={handleSchemaChange}
          rows={15}
          placeholder="Enter your JSON schema here..."
          className="font-mono text-sm rounded-md shadow-sm"
          disabled={isBusy}
        />
      </div>
       <Button onClick={handleSaveSchema} disabled={isBusy}>
         {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
         ) : (
            <Save className="mr-2 h-4 w-4" />
         )}
         Save Schema
        </Button>
    </div>
  );
}
