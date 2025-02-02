import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendation {
  symbol: string;
  name: string;
  reason: string;
}

interface AIRecommendationsProps {
  onStockSelect: (symbol: string) => void;
}

export const AIRecommendations = ({ onStockSelect }: AIRecommendationsProps) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const { toast } = useToast();

  const getAIRecommendations = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an investment idea or market sentiment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('getAIStockRecommendations', {
        body: { prompt: aiPrompt },
      });

      if (error) throw error;

      setAiRecommendations(data.recommendations);
      toast({
        title: "AI Recommendations Ready",
        description: "Here are your personalized stock recommendations!",
      });
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">AI Portfolio Recommendations</h3>
        <div className="space-y-2">
          <Textarea
            placeholder="Describe your investment idea or market sentiment (e.g., 'I think renewable energy will grow significantly')"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={getAIRecommendations}
            disabled={isLoadingAI}
            className="w-full"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoadingAI ? "Analyzing..." : "Get AI Recommendations"}
          </Button>
        </div>

        {aiRecommendations.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="font-medium">Recommended Stocks:</h4>
            {aiRecommendations.map((rec, index) => (
              <Card key={index} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{rec.symbol}</h5>
                    <p className="text-sm text-muted-foreground">{rec.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStockSelect(rec.symbol)}
                  >
                    View
                  </Button>
                </div>
                <p className="text-sm mt-2">{rec.reason}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};