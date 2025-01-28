import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";

export const AIRecommendations = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('getAIStockRecommendations', {
        body: { prompt },
      });

      if (error) throw error;

      setRecommendations(data.recommendations);
      toast({
        title: "Recommendations Ready",
        description: "Here are your AI-powered stock recommendations.",
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Recommend stocks for renewable energy sector"
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Recommendations"}
        </Button>
      </form>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold">{rec.symbol} - {rec.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};