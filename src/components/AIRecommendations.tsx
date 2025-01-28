import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { generateStockBatch } from "@/lib/mockStocks";
import { StockCard } from "./StockCard";

export const AIRecommendations = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
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

  const handleViewStock = async (symbol: string) => {
    try {
      const stocks = await generateStockBatch(1);
      const stock = {
        ...stocks[0],
        symbol: symbol,
      };
      setSelectedStock(stock);
    } catch (error) {
      console.error('Error loading stock:', error);
      toast({
        title: "Error",
        description: "Failed to load stock data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToPortfolio = async (symbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('portfolios')
        .insert([{ 
          symbol,
          user_id: user?.id 
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${symbol} has been added to your portfolio.`,
      });
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to add stock to portfolio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right" && selectedStock) {
      handleAddToPortfolio(selectedStock.symbol);
    }
    setSelectedStock(null);
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

      {selectedStock && (
        <div className="fixed inset-0 bg-background p-4 z-50">
          <div className="max-w-md mx-auto relative min-h-full">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStock(null)}
                className="absolute top-2 left-2 z-50"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-50"
                onClick={() => handleAddToPortfolio(selectedStock.symbol)}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add to Portfolio
              </Button>
            </div>
            <StockCard 
              stock={selectedStock} 
              onSwipe={handleSwipe}
            />
          </div>
        </div>
      )}

      {recommendations.length > 0 && !selectedStock && (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{rec.symbol} - {rec.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStock(rec.symbol)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToPortfolio(rec.symbol)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};