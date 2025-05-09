
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';
import { useLLMConfig } from '@/contexts/LLMContext';

export function LLMConfigForm() {
  const {
    provider: contextProvider, setProvider: setContextProvider,
    apiKey: contextApiKey, setApiKey: setContextApiKey,
    model: contextModel, setModel: setContextModel,
    isKeyValid: contextIsKeyValid, setIsKeyValid: setContextIsKeyValid,
    availableModels
  } = useLLMConfig();

  const [localProvider, setLocalProvider] = useState(contextProvider);
  const [localApiKey, setLocalApiKey] = useState(contextApiKey);
  const [localModel, setLocalModel] = useState(contextModel);
  const [localIsKeyValid, setLocalIsKeyValid] = useState<boolean | null>(contextIsKeyValid);
  
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setLocalProvider(contextProvider);
    setLocalApiKey(contextApiKey);
    setLocalModel(contextModel);
    setLocalIsKeyValid(contextIsKeyValid);
  }, [contextProvider, contextApiKey, contextModel, contextIsKeyValid]);


  const handleProviderChange = (value: string) => {
    setLocalProvider(value);
    setLocalModel(availableModels[value]?.[0] || ''); 
    setLocalIsKeyValid(null); 
  };

  const validateApiKey = async () => {
    if (!localApiKey.trim()) {
      toast({ title: "API Key Required", description: "Please enter an API key to validate.", variant: "destructive" });
      return;
    }
    setIsValidating(true);
    // Simulate API key validation - in a real app, this would make a lightweight call.
    // For Google AI, this might involve a simple, low-cost API call.
    // For now, a dummy check:
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    const isValid = localApiKey.length > 20; // Simplified dummy validation
    setLocalIsKeyValid(isValid);
    setIsValidating(false);
    if (isValid) {
      toast({ title: "API Key Format Seems Valid", description: "The API key format looks plausible. Actual validity will be tested during extraction." });
    } else {
      toast({ title: "API Key Format May Be Invalid", description: "The API key seems too short. Please check.", variant: "destructive" });
    }
  };

  const handleSaveConfiguration = () => {
    startSavingTransition(() => {
      setContextProvider(localProvider);
      setContextApiKey(localApiKey);
      setContextModel(localModel);
      setContextIsKeyValid(localIsKeyValid);
      toast({
        title: "LLM Configuration Saved",
        description: "Your LLM settings have been updated.",
      });
    });
  };

  const isBusy = isValidating || isSaving;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="llm-provider" className="text-base font-semibold">LLM Provider</Label>
        <Select value={localProvider} onValueChange={handleProviderChange} disabled={isBusy}>
          <SelectTrigger id="llm-provider" className="w-full rounded-md shadow-sm">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(availableModels).map(prov => (
                 <SelectItem key={prov} value={prov}>
                    {prov === 'googleAI' ? 'Google AI (Gemini)' : prov}
                 </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key" className="text-base font-semibold">API Key</Label>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={localApiKey}
            onChange={(e) => {
              setLocalApiKey(e.target.value);
              setLocalIsKeyValid(null); 
            }}
            className="flex-grow rounded-md shadow-sm"
            disabled={isBusy}
          />
          {localIsKeyValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
          {localIsKeyValid === false && <XCircle className="h-5 w-5 text-destructive" />}
        </div>
         <Button onClick={validateApiKey} variant="outline" size="sm" className="mt-2" disabled={isBusy || !localApiKey.trim()}>
            {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isValidating ? 'Validating...' : 'Validate Key Format'}
        </Button>
        <p className="text-xs text-muted-foreground">
            Note: API key is stored in your browser. For Google AI, ensure your key has access to the Gemini API.
        </p>
      </div>

      {availableModels[localProvider] && (
        <div className="space-y-2">
          <Label htmlFor="llm-model" className="text-base font-semibold">Model</Label>
          <Select value={localModel} onValueChange={setLocalModel} disabled={isBusy}>
            <SelectTrigger id="llm-model" className="w-full rounded-md shadow-sm">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels[localProvider].map((modelName) => (
                <SelectItem key={modelName} value={modelName}>
                  {modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           <p className="text-xs text-muted-foreground mt-1">
             The selected model here is for reference. The actual model used by Genkit flows is configured in `src/ai/genkit.ts` or within the flow itself.
           </p>
        </div>
      )}
      
      <Button onClick={handleSaveConfiguration} className="w-full" disabled={isBusy || !localApiKey.trim()}>
        {isSaving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Configuration
      </Button>
    </div>
  );
}
