import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThinkingVisualizerForm } from "@/components/ai/ThinkingVisualizerForm";

export default function ThinkingVisualizationPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Thinking Visualization</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visualize Model&apos;s Thinking Process</CardTitle>
          <CardDescription>
            Enter a query or prompt to see how the AI model processes it step-by-step.
            This can help in understanding complex extractions and tuning your prompts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThinkingVisualizerForm />
        </CardContent>
      </Card>
    </div>
  );
}
