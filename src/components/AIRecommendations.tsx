import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { Eye, Loader2, PlusCircle } from "lucide-react";
import { generateStockBatch } from "@/lib/mockStocks";

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
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add stocks to your portfolio.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('portfolios')
        .insert([{ 
          symbol,
          user_id: user.id 
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
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">{selectedStock.symbol}</h3>
              <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedStock(null)}>
              Close
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">${selectedStock.price?.toFixed(2)}</p>
            <p className="text-sm">{selectedStock.description}</p>
          </div>
        </Card>
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